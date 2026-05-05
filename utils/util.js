// utils/util.js
const util = {
  /**
   * 格式化时间
   */
  formatTime: function(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
  },

  formatNumber: function(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },

  /**
   * 相对时间格式化
   */
  formatRelativeTime: function(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    } else if (diff < 2592000000) {
      return Math.floor(diff / 86400000) + '天前';
    } else {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${this.formatNumber(date.getMonth() + 1)}-${this.formatNumber(date.getDate())}`;
    }
  },

  /**
   * 图片压缩
   */
  compressImage: function(src, quality = 80) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: src,
        quality: quality,
        success: resolve,
        fail: reject
      });
    });
  },

  /**
   * 防抖函数
   */
  debounce: function(fn, delay = 500) {
    let timer = null;
    return function(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },

  /**
   * 节流函数
   */
  throttle: function(fn, delay = 500) {
    let last = 0;
    return function(...args) {
      const now = Date.now();
      if (now - last > delay) {
        last = now;
        fn.apply(this, args);
      }
    };
  },

  /**
   * 问题状态文本映射
   */
  getStatusText: function(status) {
    const statusMap = {
      0: '待处理',
      1: '处理中',
      2: '已完成',
      3: '已关闭'
    };
    return statusMap[status] || '未知';
  },

  /**
   * 问题状态样式类名映射
   */
  getStatusClass: function(status) {
    const classMap = {
      0: 'status-pending',
      1: 'status-processing',
      2: 'status-completed',
      3: 'status-closed'
    };
    return classMap[status] || '';
  },

  /**
   * 问题分类文本映射
   */
  getCategoryText: function(category) {
    const categoryMap = {
      'environment': '环境卫生',
      'facility': '设施维修',
      'safety': '安全隐患',
      'parking': '停车管理',
      'other': '其他'
    };
    return categoryMap[category] || category;
  },

  /**
   * 紧急程度文本映射
   */
  getUrgencyText: function(urgency) {
    return urgency === 1 ? '紧急' : '普通';
  }
};

module.exports = util;
