#!/usr/bin/env python3
# 静态验证 + 用户态模拟 DriverEntry（不加载真实内核驱动）
import struct, sys, pefile
from unicorn import Uc, UC_ARCH_X86, UC_MODE_32, UC_HOOK_CODE, UC_HOOK_MEM_UNMAPPED, UC_PROT_ALL
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP, UC_X86_REG_EBP, UC_X86_REG_EAX

PATH = "/workspace/analysis/res/附件dog.sys_IFTDLL_2052.bin"
raw = open(PATH,'rb').read()
pe = pefile.PE(PATH)
IB = pe.OPTIONAL_HEADER.ImageBase
IMAGE_SIZE = 0x4000
STUB = 0x500000
DONE = 0x4ff000
HEAP = 0x800000
HEAP_SIZE = 0x200000
STACK = 0x700000
STACK_SIZE = 0x20000
DRVOBJ = 0x600000
REGPATH = 0x601000

uc = Uc(UC_ARCH_X86, UC_MODE_32)
for base, size in [(IB, IMAGE_SIZE), (STUB, 0x10000), (DONE, 0x1000),
                   (HEAP, HEAP_SIZE), (STACK, STACK_SIZE), (0x600000, 0x2000)]:
    uc.mem_map(base, size, UC_PROT_ALL)

# 加载 PE
hdr = pe.OPTIONAL_HEADER.SizeOfHeaders
uc.mem_write(IB, raw[:hdr])
for s in pe.sections:
    data = s.get_data()
    if data:
        uc.mem_write(IB + s.VirtualAddress, data)

heap_ptr = HEAP + 0x1000
def halloc(n, align=8):
    global heap_ptr
    heap_ptr = (heap_ptr + align - 1) & ~(align - 1)
    p = heap_ptr
    heap_ptr += (n + 15) & ~15
    if heap_ptr >= HEAP + HEAP_SIZE:
        raise RuntimeError("heap exhausted")
    return p

def r_u32(a): return struct.unpack("<I", uc.mem_read(a, 4))[0]
def w_u32(a, v): uc.mem_write(a, struct.pack("<I", v & 0xffffffff))
def r_u16(a): return struct.unpack("<H", uc.mem_read(a, 2))[0]
def w_u16(a, v): uc.mem_write(a, struct.pack("<H", v & 0xffff))
def r_str(a):
    if a == 0: return ""
    out = b""; i = 0
    while True:
        ch = uc.mem_read(a + i, 2)
        if ch == b"\x00\x00": break
        out += ch; i += 2
        if i > 1024: break
    return out.decode("utf-16le", "replace")

def unicode_string_at(a):
    return r_str(r_u32(a + 4)), r_u16(a), r_u16(a + 2)

# 导入表 -> stub
imports = []
for dll in pe.DIRECTORY_ENTRY_IMPORT:
    for imp in dll.imports:
        imports.append((imp.address, (imp.name or b"ord").decode(), dll.dll.decode()))
api_index = {}
for i, (iat_va, name, dll) in enumerate(imports):
    addr = STUB + i * 0x10
    api_index[addr] = name
    uc.mem_write(addr, b"\xf4")
    w_u32(iat_va, addr)

ARGS = {
 "RtlInitUnicodeString": 2, "IoCreateDevice": 7, "IoCreateSymbolicLink": 2,
 "ZwCreateDirectoryObject": 3, "ZwMakeTemporaryObject": 1, "ZwClose": 1,
 "KeInitializeSpinLock": 1, "KeInitializeEvent": 3, "PsCreateSystemThread": 7,
 "ObReferenceObjectByHandle": 6, "ExAllocatePoolWithTag": 3, "IofCompleteRequest": 2,
 "IoDeleteDevice": 1, "IoDeleteSymbolicLink": 1, "IoFreeIrp": 1, "IoFreeMdl": 1,
 "MmUnlockPages": 1, "KeSetEvent": 3, "KeWaitForSingleObject": 5,
 "IoGetConfigurationInformation": 0, "IoGetDeviceObjectPointer": 5,
 "IoAllocateIrp": 2, "IoAllocateMdl": 5, "MmProbeAndLockPages": 2,
 "IofCallDriver": 2, "ExFreePool": 1, "KeGetCurrentThread": 0,
 "MmMapLockedPagesSpecifyCache": 6, "PsTerminateSystemThread": 1,
 "ExfInterlockedInsertTailList": 3, "ExfInterlockedRemoveHeadList": 2,
 "KeSetPriorityThread": 2, "ObfDereferenceObject": 1, "RtlFreeAnsiString": 1,
 "RtlUnicodeStringToAnsiString": 3, "ZwQuerySymbolicLinkObject": 3,
 "ZwOpenSymbolicLinkObject": 3,
}

devices, links, dirs, threads = [], [], [], []

def handler(uc, address, size, user):
    pc = uc.reg_read(UC_X86_REG_EIP)
    name = api_index.get(pc, "?")
    sp = uc.reg_read(UC_X86_REG_ESP)
    n = ARGS.get(name, 0)
    args = [r_u32(sp + 4 + 4 * i) for i in range(n)]
    ret = r_u32(sp)
    result = 0

    if name == "RtlInitUnicodeString":
        dst, src = args
        s = r_str(src)
        buf = halloc(len(s) * 2 + 2)
        uc.mem_write(buf, s.encode("utf-16le") + b"\x00\x00")
        w_u16(dst, len(s) * 2); w_u16(dst + 2, len(s) * 2 + 2); w_u32(dst + 4, buf)
    elif name == "IoCreateDevice":
        drv, extsize, devname, devtype, chars, excl, out = args
        obj = halloc(0x200)
        ext = halloc(max(extsize, 0x40) + 0x80)
        uc.mem_write(obj, b"\x00" * 0x200)
        w_u32(obj + 0x28, ext)
        w_u32(out, obj)
        devices.append((r_str(r_u32(devname + 4)), devtype, extsize, obj))
    elif name == "IoCreateSymbolicLink":
        link, target = args
        links.append((r_str(r_u32(link + 4)), r_str(r_u32(target + 4))))
    elif name == "ZwCreateDirectoryObject":
        out = args[0]
        w_u32(out, 0x1234)
        dirs.append("dir")
    elif name == "PsCreateSystemThread":
        out = args[0]; start = args[5]
        w_u32(out, 0x5678)
        threads.append(start)
    elif name == "ObReferenceObjectByHandle":
        out = args[4]
        obj = halloc(0x100)
        uc.mem_write(obj, b"\x00" * 0x100)
        w_u32(out, obj)
    elif name == "ExAllocatePoolWithTag":
        result = halloc(args[1])
    elif name == "IoGetConfigurationInformation":
        ci = halloc(0x100)
        uc.mem_write(ci, b"\x00" * 0x100)
        w_u32(ci + 0, 1)       # DiskCount
        result = ci
    elif name in ("KeSetEvent", "KeWaitForSingleObject"):
        result = 0
    else:
        result = 0

    uc.reg_write(UC_X86_REG_EAX, result)
    uc.reg_write(UC_X86_REG_ESP, sp + 4 + 4 * n)
    uc.reg_write(UC_X86_REG_EIP, ret)

def on_bad(uc, access, address, size, value, user):
    pc = uc.reg_read(UC_X86_REG_EIP)
    print("!! 非法内存访问 pc=%08x addr=%08x size=%d" % (pc, address, size))
    uc.emu_stop()
    return False

def on_done(uc, address, size, user):
    uc.emu_stop()

uc.hook_add(UC_HOOK_CODE, handler, begin=STUB, end=STUB + 0x10000)
uc.hook_add(UC_HOOK_CODE, on_done, begin=DONE, end=DONE + 0x1000)
uc.hook_add(UC_HOOK_MEM_UNMAPPED, on_bad)

# 伪造 DRIVER_OBJECT / RegistryPath
uc.mem_write(DRVOBJ, b"\x00" * 0x200)
uc.mem_write(REGPATH, b"\x00" * 0x100)

# 调用 DriverEntry(DriverObject, RegistryPath)
sp = STACK + STACK_SIZE - 0x1000
w_u32(sp, DONE)
w_u32(sp + 4, DRVOBJ)
w_u32(sp + 8, REGPATH)
uc.reg_write(UC_X86_REG_ESP, sp)
uc.reg_write(UC_X86_REG_EBP, 0)
entry = IB + pe.OPTIONAL_HEADER.AddressOfEntryPoint
uc.reg_write(UC_X86_REG_EIP, entry)

print("DriverEntry = %08x, ImageBase=%08x" % (entry, IB))
try:
    uc.emu_start(entry, DONE, count=2000000)
    print("执行结束, EAX=%08x" % uc.reg_read(UC_X86_REG_EAX))
except Exception as e:
    print("模拟异常:", e)

print("创建目录: %d" % len(dirs))
print("创建设备: %d" % len(devices))
for d in devices[:3] + devices[-1:]:
    print("   %-24s type=%d ext=%d flags=%02x" % (d[0], d[1], d[2], r_u32(d[3]+0x1c) & 0xff))
print("创建符号链接: %d" % len(links))
for l in links[:6]:
    print("   %-16s -> %s" % l)
print("创建线程: %d" % len(threads))
for t in threads[:6]:
    print("   start=%08x" % t)

# 检查分发函数表
print("MajorFunction[0]=%08x [2]=%08x [3]=%08x [4]=%08x [14]=%08x" % tuple(
    r_u32(DRVOBJ + 0x38 + 4 * i) for i in (0, 2, 3, 4, 14)))
print("DriverUnload=%08x" % r_u32(DRVOBJ + 0x34))
