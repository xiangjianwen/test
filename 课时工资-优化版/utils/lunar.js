/**
 * 农历工具（精简重构自原项目 utils/calendar-converter.js）
 * 提供公历 → 农历转换，含中文农历日、生肖、农历/公历节日、二十四节气。
 * 有效范围：1901–2050 年。
 */

// 农历信息表（1900-2050）：每位表示月份大小，高四位表示闰月
var lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260,
  0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255,
  0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40,
  0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0,
  0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4,
  0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0,
  0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570,
  0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4,
  0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a,
  0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50,
  0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552,
  0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9,
  0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60,
  0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0,
  0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577,
  0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0
];

var Animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
var cmonthName = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '腊'];
var nStr1 = ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
var nStr2 = ['初', '十', '廿', '卅'];

// 公历节日
var sFtv = [
  '0101*元旦', '0214 情人节', '0308 妇女节', '0312 植树节', '0401 愚人节',
  '0422 地球日', '0501 劳动节', '0504 青年节', '0531 无烟日', '0601 儿童节',
  '0606 爱眼日', '0701 建党日', '0707 抗战纪念日', '0801 建军节', '0910 教师节',
  '0918 九·一八事变纪念日', '1001*国庆节', '1031 万圣节', '1111 光棍节',
  '1201 艾滋病日', '1213 南京大屠杀纪念日', '1224 平安夜', '1225 圣诞节'
];

// 某月第几个星期几（w<5 表示正数第 w 个；dow 0=周日）
var wFtv = ['0520 母亲节', '0630 父亲节', '1144 感恩节'];

// 农历节日
var lFtv = [
  '0101*春节', '0115 元宵节', '0202 龙抬头', '0505 端午节', '0707 七夕',
  '0715 中元节', '0815 中秋节', '0909 重阳节', '1208 腊八节', '1223 小年', '0100*除夕'
];

var solarTerm = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明',
  '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];

var solarTermBase = [4, 19, 3, 18, 4, 19, 4, 19, 4, 20, 4, 20, 6, 22, 6, 22, 6, 22, 7, 22, 6, 21, 6, 21];
var solarTermIdx = '0123415341536789:;<9:=<>:=1>?012@015@015@015AB78CDE8CD=1FD01GH01GH01IH01IJ0KLMN;LMBEOPDQRST0RUH0RVH0RWH0RWM0XYMNZ[MB\\]PT^_ST`_WH`_WH`_WM`_WM`aYMbc[Mde]Sfe]gfh_gih_Wih_WjhaWjka[jkl[jmn]ope]qph_qrh_sth_W';
var solarTermOS = '211122112122112121222211221122122222212222222221222122222232222222222222222233223232223232222222322222112122112121222211222122222222222222222222322222112122112121222111211122122222212221222221221122122222222222222222222223222232222232222222222222112122112121122111211122122122212221222221221122122222222222222221211122112122212221222211222122222232222232222222222222112122112121111111222222112121112121111111222222111121112121111111211122112122112121122111222212111121111121111111111122112122112121122111211122112122212221222221222211111121111121111111222111111121111111111111111122112121112121111111222111111111111111111111111122111121112121111111221122122222212221222221222111011111111111111111111122111121111121111111211122112122112121122211221111011111101111111111111112111121111121111111211122112122112221222211221111011111101111111110111111111121111111111111111122112121112121122111111011111121111111111111111011111111112111111111111011111111111111111111221111011111101110111110111011011111111111111111221111011011101110111110111011011111101111111111211111001011101110111110110011011111101111111111211111001011001010111110110011011111101111111110211111001011001010111100110011011011101110111110211111001011001010011100110011001011101110111110211111001010001010011000100011001011001010111110111111001010001010011000111111111111111111111111100011001011001010111100111111001010001010000000111111000010000010000000100011001011001010011100110011001011001110111110100011001010001010011000110011001011001010111110111100000010000000000000000011001010001010011000111100000000000000000000000011001010001010000000111000000000000000000000011001010000010000000';

//====== 农历年总天数 ======
function lYearDays(y) {
  var sum = 348;
  for (var i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
  return sum + leapDays(y);
}

//====== 农历年闰月天数 ======
function leapDays(y) {
  if (leapMonth(y)) return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
  return 0;
}

//====== 农历年闰几月（0 表示无闰月）======
function leapMonth(y) {
  return lunarInfo[y - 1900] & 0xf;
}

//====== 农历某月天数 ======
function monthDays(y, m) {
  return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

//====== 某年第 n 个节气是几号（n 从 0=小寒 起算）======
function sTerm(y, n) {
  return solarTermBase[n] + Math.floor(solarTermOS.charAt((Math.floor(solarTermIdx.charCodeAt(y - 1900)) - 48) * 24 + n));
}

//====== 中文农历日 ======
function getCDay(d) {
  if (d === 10) return '初十';
  if (d === 20) return '二十';
  if (d === 30) return '三十';
  return nStr2[Math.floor(d / 10)] + nStr1[d % 10];
}

//====== 公历日期 → 农历（核心算法）======
function lunarOf(date) {
  var objDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  var i, leap = 0, temp = 0;
  var baseDate = new Date(1900, 0, 31);
  var offset = Math.round((objDate - baseDate) / 86400000);

  for (i = 1900; i < 2050 && offset > 0; i++) {
    temp = lYearDays(i);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    i--;
  }
  var year = i;

  leap = leapMonth(year);
  var isLeap = false;

  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      --i;
      isLeap = true;
      temp = leapDays(year);
    } else {
      temp = monthDays(year, i);
    }
    if (isLeap && i === (leap + 1)) isLeap = false;
    offset -= temp;
  }

  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --i;
    }
  }
  if (offset < 0) {
    offset += temp;
    --i;
  }

  return { year: year, month: i, day: offset + 1, isLeap: isLeap };
}

/**
 * 公历 → 农历（对外接口）
 * @param {Date} date
 * @returns {{lYear, lMonth, lDay, lunarMonth, lunarDay, animal, festival, term}}
 *          festival：农历/公历节日名（优先农历），term：节气名，无则空字符串
 */
function solar2lunar(date) {
  var sYear = date.getFullYear();
  var sMonth = date.getMonth() + 1;
  var sDay = date.getDate();
  var lunar = lunarOf(date);

  // 节气
  var term = '';
  var t1 = sTerm(sYear, (sMonth - 1) * 2) - 1;
  var t2 = sTerm(sYear, (sMonth - 1) * 2 + 1) - 1;
  if (t1 === sDay - 1) term = solarTerm[(sMonth - 1) * 2];
  if (t2 === sDay - 1) term = solarTerm[(sMonth - 1) * 2 + 1];

  // 公历固定日期节日
  var solarFestival = '';
  for (var i = 0; i < sFtv.length; i++) {
    var m = sFtv[i].match(/^(\d{2})(\d{2})[\s\*](.+)$/);
    if (m && Number(m[1]) === sMonth && Number(m[2]) === sDay) {
      solarFestival = m[3];
      break;
    }
  }

  // 公历月周节日（修复了原版不校验实际星期的缺陷）
  if (!solarFestival) {
    for (var j = 0; j < wFtv.length; j++) {
      var w = wFtv[j].match(/^(\d{2})(\d)(\d)[\s\*](.+)$/);
      if (w && Number(w[1]) === sMonth) {
        var nth = Number(w[2]);
        var dow = Number(w[3]);
        if (nth < 5) {
          var wDate = (dow === 0 ? 7 : 0) + (nth - 1) * 7 + dow;
          var realDow = date.getDay() === 0 ? 7 : date.getDay();
          if (wDate === sDay && realDow === (dow === 0 ? 7 : dow)) {
            solarFestival = w[4];
            break;
          }
        }
      }
    }
  }

  // 农历节日
  var lunarFestival = '';
  for (var k = 0; k < lFtv.length; k++) {
    var l = lFtv[k].match(/^(\d{2})(.{2})[\s\*](.+)$/);
    if (l) {
      var lm = Number(l[1]);
      var ld = l[2];
      var monLen = monthDays(lunar.year, lunar.month);
      var isLastDayOfLaYue = lunar.month === 12 && monLen === lunar.day;
      if ((lm === lunar.month && Number(ld) === lunar.day) || (ld === '00' && isLastDayOfLaYue)) {
        lunarFestival = l[3];
        break;
      }
    }
  }

  return {
    lYear: lunar.year,
    lMonth: lunar.month,
    lDay: lunar.day,
    lunarMonth: cmonthName[lunar.month - 1],
    lunarDay: getCDay(lunar.day),
    animal: Animals[(lunar.year - 1900 + 12) % 12],
    festival: lunarFestival || solarFestival,
    term: term
  };
}

module.exports = { solar2lunar: solar2lunar };
