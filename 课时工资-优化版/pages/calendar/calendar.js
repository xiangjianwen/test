// 日历页：月历 + 每日课程勾选 + 月度工资统计
var core = require('../../utils/core.js');
var store = require('../../utils/store.js');

var PALETTE = ['#4F6EF7', '#12B886', '#FA8C16', '#EB5757', '#9B51E0', '#00B8D9', '#E84393', '#8BC34A'];

Page({
  data: {
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    dateText: '',
    pickerValue: '',
    cells: [],
    total: 0,
    subjects: [],
    hasTimetable: false,
    detail: null
  },

  onLoad: function () {
    var now = new Date();
    this.y = now.getFullYear();
    this.m = now.getMonth();
    this.detailDay = 0;
    this.refresh();
  },

  onShow: function () {
    // 课表可能在「课表」页被修改，回到本页时刷新
    this.refresh();
  },

  refresh: function () {
    var y = this.y, m = this.m;
    var timetable = store.getTimetable();
    var records = store.getRecords();
    var now = new Date();
    var isTodayMonth = now.getFullYear() === y && now.getMonth() === m;
    var todayD = now.getDate();
    var hasTimetable = false;

    var cells = core.monthCells(y, m).map(function (c, i) {
      if (!c) return { key: i, day: 0 };
      var list = core.dayChecked(records, timetable, y, m, c.day);
      if (list.length) hasTimetable = true;
      return {
        key: i,
        day: c.day,
        weekday: c.weekday,
        lunar: c.lunar,
        lunarHl: c.lunarHl,
        hasCourse: list.length > 0,
        amount: core.dayAmount(list),
        isToday: isTodayMonth && c.day === todayD
      };
    });

    var sum = core.monthSummary(timetable, records, y, m);
    var subjects = sum.subjects.map(function (s, i) {
      s.color = PALETTE[i % PALETTE.length];
      return s;
    });

    this.setData({
      dateText: y + '年' + (m + 1) + '月',
      pickerValue: y + '-' + (m + 1 < 10 ? '0' + (m + 1) : (m + 1)),
      cells: cells,
      total: sum.total,
      subjects: subjects,
      hasTimetable: hasTimetable,
      detail: this.detailDay ? this.buildDetail(this.detailDay) : null
    });
  },

  buildDetail: function (day) {
    var timetable = store.getTimetable();
    var records = store.getRecords();
    var list = core.dayChecked(records, timetable, this.y, this.m, day);
    var wdName = core.WEEKDAY_NAMES[core.weekdayOf(this.y, this.m, day) - 1];
    return {
      day: day,
      title: (this.m + 1) + '月' + day + '日 · 周' + wdName,
      list: list,
      total: core.dayAmount(list)
    };
  },

  tapDay: function (e) {
    var cell = this.data.cells[e.currentTarget.dataset.index];
    if (!cell || !cell.day) return;
    this.detailDay = cell.day;
    this.setData({ detail: this.buildDetail(cell.day) });
  },

  toggleSlot: function (e) {
    var lesson = e.currentTarget.dataset.lesson;
    var item = null;
    var list = this.data.detail.list;
    for (var i = 0; i < list.length; i++) {
      if (list[i].lesson === lesson) { item = list[i]; break; }
    }
    if (!item) return;
    var records = core.setSlotChecked(store.getRecords(), this.y, this.m, this.detailDay, lesson, !item.on);
    store.saveRecords(records);
    this.refresh();
  },

  closeDetail: function () {
    this.detailDay = 0;
    this.setData({ detail: null });
  },

  goToday: function () {
    var now = new Date();
    this.y = now.getFullYear();
    this.m = now.getMonth();
    this.refresh();
  },

  goLastMonth: function () {
    if (this.m === 0) { this.m = 11; this.y--; } else { this.m--; }
    if (this.y < 1901) { this.y = 1901; this.m = 0; return; }
    this.refresh();
  },

  goNextMonth: function () {
    if (this.m === 11) { this.m = 0; this.y++; } else { this.m++; }
    if (this.y > 2050) { this.y = 2050; this.m = 11; return; }
    this.refresh();
  },

  bindMonthChange: function (e) {
    var parts = e.detail.value.split('-');
    this.y = +parts[0];
    this.m = +parts[1] - 1;
    this.refresh();
  },

  goTimetable: function () {
    wx.switchTab({ url: '/pages/timetable/timetable' });
  },

  noop: function () { }
});
