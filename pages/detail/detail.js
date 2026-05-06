const util = require('../../utils/util.js');

Page({
  data: {
    issueId: '',
    issue: null,
    loading: true,
    loadError: false,
    remarkInput: '',
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        issueId: options.id
      });
      this.loadDetail();
    }
  },

  // 加载问题详情
  async loadDetail() {
    this.setData({ loading: true, loadError: false });

    try {
      const res = await wx.cloud.callFunction({
        name: 'getIssueDetail',
        data: {
          issueId: this.data.issueId
        }
      });

      console.log('getIssueDetail返回:', JSON.stringify(res.result));

      if (res.result && res.result.errMsg === 'cloud.callFunction:ok' && res.result.data) {
        const issue = res.result.data;
        issue.categoryText = util.getCategoryText(issue.category);
        issue.statusText = util.getStatusText(issue.status);
        issue.statusClass = util.getStatusClass(issue.status);
        issue.createTimeText = util.formatTime(new Date(issue.createTime));

        this.setData({
          issue,
          loading: false
        });
      } else {
        this.setData({ loading: false, loadError: true });
      }
    } catch (err) {
      console.error('加载详情失败', err);
      this.setData({ loading: false, loadError: true });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 重试加载
  retryLoad() {
    this.loadDetail();
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.issue.images || [];
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ remarkInput: e.detail.value });
  },

  // 确认处理
  async handleProcess() {
    const remark = this.data.remarkInput.trim();
    if (!remark) {
      wx.showToast({ title: '请填写处理备注', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'updateIssueStatus',
        data: {
          issueId: this.data.issueId,
          remark: remark
        }
      });

      if (res.result && res.result.errMsg === 'cloud.callFunction:ok') {
        wx.showToast({ title: '处理成功', icon: 'success' });
        this.setData({ remarkInput: '' });
        this.loadDetail();
      } else {
        wx.showToast({
          title: res.result.errMsg || '处理失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('处理失败', err);
      wx.showToast({ title: '处理失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
