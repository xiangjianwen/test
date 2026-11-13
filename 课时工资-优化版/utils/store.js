/**
 * 存储层：封装小程序本地存储
 */
var core = require('./core.js');

var TIMETABLE_KEY = 'timetable_v2';
var RECORDS_KEY = 'records_v2';

function getTimetable() {
  var tt = wx.getStorageSync(TIMETABLE_KEY);
  if (core.isValidTimetable(tt)) return tt;
  return core.emptyTimetable();
}

function saveTimetable(tt) {
  wx.setStorageSync(TIMETABLE_KEY, tt);
}

function getRecords() {
  var r = wx.getStorageSync(RECORDS_KEY);
  return (r && typeof r === 'object') ? r : {};
}

function saveRecords(records) {
  wx.setStorageSync(RECORDS_KEY, records);
}

// 清空课表与全部记录
function clearAll() {
  wx.removeStorageSync(TIMETABLE_KEY);
  wx.removeStorageSync(RECORDS_KEY);
}

module.exports = {
  getTimetable: getTimetable,
  saveTimetable: saveTimetable,
  getRecords: getRecords,
  saveRecords: saveRecords,
  clearAll: clearAll
};
