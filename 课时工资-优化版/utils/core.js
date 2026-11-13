/**
 * 课时工资核心逻辑（纯函数，无平台依赖，小程序与 H5 共用）
 *
 * 数据结构：
 * timetable = { slots: Array(84) }   slots[(节次-1)*7 + (星期-1)] = { subject, price } | null
 *   节次 1-12，星期 1-7（1=周一 ... 7=周日）
 * records = { '2026-11': { '13': [bool×12] } }   某月某天 12 节的勾选状态（true=计入工资）
 *   未记录的天默认全部计入
 */
var lunar = require('./lunar.js');

var LESSONS_PER_DAY = 12;
var WEEKDAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];

// 星期（1=周一 ... 7=周日）
function weekdayOf(y, m, d) {
  return (new Date(y, m, d).getDay() + 6) % 7 + 1;
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function slotIndex(lesson, weekday) {
  return (lesson - 1) * 7 + (weekday - 1);
}

function emptyTimetable() {
  return { slots: new Array(LESSONS_PER_DAY * 7).fill(null) };
}

function isValidTimetable(tt) {
  return tt && Array.isArray(tt.slots) && tt.slots.length === LESSONS_PER_DAY * 7;
}

// 某天课表：[{ lesson, subject, price }]
function daySlots(timetable, y, m, d) {
  var wd = weekdayOf(y, m, d);
  var list = [];
  for (var lesson = 1; lesson <= LESSONS_PER_DAY; lesson++) {
    var s = timetable.slots[slotIndex(lesson, wd)];
    if (s && s.subject) list.push({ lesson: lesson, subject: s.subject, price: s.price });
  }
  return list;
}

// 某天课程 + 勾选状态：[{ lesson, subject, price, on }]
function dayChecked(records, timetable, y, m, d) {
  var key = y + '-' + (m + 1);
  var rec = records[key] && records[key][d];
  return daySlots(timetable, y, m, d).map(function (s) {
    return { lesson: s.lesson, subject: s.subject, price: s.price, on: rec ? !!rec[s.lesson - 1] : true };
  });
}

// 切换某天某节的勾选，返回新 records
function setSlotChecked(records, y, m, d, lesson, on) {
  var key = y + '-' + (m + 1);
  var clone = {};
  Object.keys(records).forEach(function (k) { clone[k] = records[k]; });
  clone[key] = {};
  Object.keys(records[key] || {}).forEach(function (dk) { clone[key][dk] = records[key][dk]; });
  if (!clone[key][d]) {
    clone[key][d] = new Array(LESSONS_PER_DAY).fill(true);
  } else {
    clone[key][d] = clone[key][d].slice();
  }
  clone[key][d][lesson - 1] = on;
  return clone;
}

// 某天工资
function dayAmount(list) {
  return list.reduce(function (sum, x) { return sum + (x.on ? x.price : 0); }, 0);
}

// 月历 42 格：null 或 { day, lunar, weekday }（lunar 为显示用的短文本）
function monthCells(y, m) {
  var firstWeekday = weekdayOf(y, m, 1); // 1 号前有 firstWeekday-1 个空格
  var offset = firstWeekday - 1;
  var count = daysInMonth(y, m);
  var cells = [];
  for (var i = 0; i < 42; i++) {
    var day = i - offset + 1;
    if (day < 1 || day > count) { cells.push(null); continue; }
    var l = lunar.solar2lunar(new Date(y, m, day));
    var text;
    if (l.festival) text = l.festival;
    else if (l.term) text = l.term;
    else if (l.lDay === 1) text = l.lunarMonth + '月';
    else text = l.lunarDay;
    cells.push({ day: day, lunar: text, lunarHl: !!(l.festival || l.term), weekday: (i % 7) + 1 });
  }
  return cells;
}

// 月度汇总：{ total, subjects: [{ subject, price, count, sum }] }
function monthSummary(timetable, records, y, m) {
  var map = {};
  var order = [];
  var count = daysInMonth(y, m);
  for (var d = 1; d <= count; d++) {
    var list = dayChecked(records, timetable, y, m, d);
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (!s.on) continue;
      if (!map[s.subject]) {
        map[s.subject] = { subject: s.subject, price: s.price, count: 0 };
        order.push(s.subject);
      }
      map[s.subject].count++;
    }
  }
  var subjects = order.map(function (k) {
    var x = map[k];
    return { subject: x.subject, price: x.price, count: x.count, sum: Math.round(x.price * x.count * 100) / 100 };
  });
  var total = subjects.reduce(function (sum, x) { return sum + x.sum; }, 0);
  return { total: Math.round(total * 100) / 100, subjects: subjects };
}

// 课表中涉及的科目汇总
function timetableSubjects(timetable) {
  var map = {};
  var order = [];
  for (var i = 0; i < timetable.slots.length; i++) {
    var s = timetable.slots[i];
    if (!s || !s.subject) continue;
    if (!map[s.subject]) {
      map[s.subject] = { subject: s.subject, price: s.price, count: 0 };
      order.push(s.subject);
    }
    map[s.subject].count++;
  }
  return order.map(function (k) { return map[k]; });
}

function money(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  LESSONS_PER_DAY: LESSONS_PER_DAY,
  WEEKDAY_NAMES: WEEKDAY_NAMES,
  weekdayOf: weekdayOf,
  daysInMonth: daysInMonth,
  slotIndex: slotIndex,
  emptyTimetable: emptyTimetable,
  isValidTimetable: isValidTimetable,
  daySlots: daySlots,
  dayChecked: dayChecked,
  setSlotChecked: setSlotChecked,
  dayAmount: dayAmount,
  monthCells: monthCells,
  monthSummary: monthSummary,
  timetableSubjects: timetableSubjects,
  money: money
};
