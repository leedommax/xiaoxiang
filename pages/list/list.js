const util = require('../../utils/util.js');

Page({
  data: {
    activeTab: 'mine',
    statusList: [
      { label: '全部', value: '' },
      { label: '待处理', value: '0' },
      { label: '处理中', value: '1' },
      { label: '已完成', value: '2' }
    ],
    activeStatus: '',
    issueList: [],
    page: 0,
    pageSize: 20,
    hasMore: true,
    loading: false,
    loaded: false
  },

  onLoad() {
    this.loadIssues();
  },

  onShow() {
    if (this.data.loaded) {
      this.refreshList();
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.refreshList();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  // 刷新列表
  async refreshList() {
    this.setData({
      page: 0,
      issueList: [],
      hasMore: true
    });
    await this.loadIssues();
  },

  // 加载问题列表
  async loadIssues() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'getIssueList',
        data: {
          filter: this.data.activeTab,
          status: this.data.activeStatus,
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      });
      console.log('getIssueList返回:', JSON.stringify(res.result));

      if (res.result && res.result.errMsg === 'cloud.callFunction:ok' && res.result.data) {
        const list = res.result.data.list.map(item => {
          return {
            ...item,
            categoryText: util.getCategoryText(item.category),
            statusText: util.getStatusText(item.status),
            statusClass: util.getStatusClass(item.status),
            createTimeText: util.formatRelativeTime(new Date(item.createTime).getTime())
          };
        });

        this.setData({
          issueList: [...this.data.issueList, ...list],
          hasMore: res.result.data.hasMore,
          loading: false,
          loaded: true
        });
      } else {
        // 云函数返回但业务失败，也要关闭loading
        this.setData({ loading: false, loaded: true });
      }
    } catch (err) {
      console.error('加载失败', err);
      this.setData({ loading: false, loaded: true });
      wx.showToast({
        title: '加载失败,请重试',
        icon: 'none'
      });
    }
  },

  // 加载更多
  loadMore() {
    this.setData({
      page: this.data.page + 1
    }, () => {
      this.loadIssues();
    });
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab !== this.data.activeTab) {
      this.setData({
        activeTab: tab,
        activeStatus: ''
      }, () => {
        this.refreshList();
      });
    }
  },

  // 状态筛选
  filterByStatus(e) {
    const status = e.currentTarget.dataset.status;
    if (status !== this.data.activeStatus) {
      this.setData({
        activeStatus: status
      }, () => {
        this.refreshList();
      });
    }
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 跳转到提交页
  goToSubmit() {
    wx.redirectTo({
      url: '/pages/submit/submit'
    });
  },

  // 保持在列表页
  goToList() {
    // 已在列表页,无需跳转
  },

  // 跳转到统计页
  goToStatistics() {
    wx.redirectTo({
      url: '/pages/statistics/statistics'
    });
  }
});
