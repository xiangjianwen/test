// 课表页：编辑每周 12 节 × 7 天的课程与课时费
var core = require('../../utils/core.js');
var store = require('../../utils/store.js');

var PALETTE = ['#4F6EF7', '#12B886', '#FA8C16', '#EB5757', '#9B51E0', '#00B8D9', '#E84393', '#8BC34A'];

Page({
  data: {
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    rows: [],
    subjects: [],
    edit: null
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    var tt = store.getTimetable();
    var subjects = core.timetableSubjects(tt);
    var colorOf = {};
    subjects.forEach(function (s, i) { colorOf[s.subject] = PALETTE[i % PALETTE.length]; });

    var rows = [];
    for (var lesson = 1; lesson <= core.LESSONS_PER_DAY; lesson++) {
      var cells = [];
      for (var wd = 1; wd <= 7; wd++) {
        var s = tt.slots[core.slotIndex(lesson, wd)];
        cells.push({
          key: lesson + '-' + wd,
          lesson: lesson,
          weekday: wd,
          subject: s ? s.subject : '',
          price: s ? s.price : '',
          color: s ? (colorOf[s.subject] || PALETTE[0]) : ''
        });
      }
      rows.push({ key: 'r' + lesson, lesson: lesson, cells: cells });
    }

    this.setData({
      rows: rows,
      subjects: subjects.map(function (s, i) {
        s.color = PALETTE[i % PALETTE.length];
        return s;
      })
    });
  },

  tapCell: function (e) {
    var lesson = e.currentTarget.dataset.lesson;
    var weekday = e.currentTarget.dataset.weekday;
    var tt = store.getTimetable();
    var s = tt.slots[core.slotIndex(lesson, weekday)];
    this.setData({
      edit: {
        lesson: lesson,
        weekday: weekday,
        subject: s ? s.subject : '',
        price: s ? String(s.price) : ''
      }
    });
  },

  onSubjectInput: function (e) {
    this.setData({ 'edit.subject': e.detail.value });
  },

  onPriceInput: function (e) {
    this.setData({ 'edit.price': e.detail.value });
  },

  pickSubject: function (e) {
    var subject = e.currentTarget.dataset.subject;
    var known = null;
    this.data.subjects.forEach(function (s) { if (s.subject === subject) known = s; });
    this.setData({
      'edit.subject': subject,
      'edit.price': this.data.edit.price !== '' ? this.data.edit.price : (known ? String(known.price) : '')
    });
  },

  saveEdit: function () {
    var ed = this.data.edit;
    var subject = (ed.subject || '').trim();
    var price = core.money(parseFloat(ed.price));
    if (!subject) {
      wx.showToast({ title: '请输入科目名称', icon: 'none' });
      return;
    }
    if (!(price > 0)) {
      wx.showToast({ title: '请输入正确的课时费', icon: 'none' });
      return;
    }
    var tt = store.getTimetable();
    tt.slots[core.slotIndex(ed.lesson, ed.weekday)] = { subject: subject, price: price };
    store.saveTimetable(tt);
    this.setData({ edit: null });
    this.refresh();
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  clearCell: function () {
    var ed = this.data.edit;
    var tt = store.getTimetable();
    tt.slots[core.slotIndex(ed.lesson, ed.weekday)] = null;
    store.saveTimetable(tt);
    this.setData({ edit: null });
    this.refresh();
  },

  closeEdit: function () {
    this.setData({ edit: null });
  },

  clearTimetable: function () {
    var that = this;
    wx.showModal({
      title: '清空课表',
      content: '确定清空所有课程安排吗？已保存的上课勾选不受影响。',
      confirmColor: '#EB5757',
      success: function (r) {
        if (r.confirm) {
          store.saveTimetable(core.emptyTimetable());
          that.refresh();
        }
      }
    });
  },

  clearAllData: function () {
    var that = this;
    wx.showModal({
      title: '清空全部数据',
      content: '将清空课表和所有月份的上课记录，确定继续吗？',
      confirmColor: '#EB5757',
      success: function (r) {
        if (r.confirm) {
          store.clearAll();
          that.refresh();
        }
      }
    });
  },

  noop: function () { }
});
