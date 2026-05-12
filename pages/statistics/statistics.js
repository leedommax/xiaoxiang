const util = require('../../utils/util.js');

Page({
  data: {
    overview: {
      total: 0,
      monthTotal: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      processRate: 0
    },
    categoryStats: [],
    trendData: [],
    maxCount: 1,
    loading: true,
    loaded: false
  },

  onLoad() {
    this.loadStatistics();
  },

  onShow() {
    if (this.data.loaded) {
      this.loadStatistics();
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadStatistics();
    wx.stopPullDownRefresh();
  },

  // 加载统计数据
  async loadStatistics() {
    this.setData({ loading: true });

    try {
      // 并行请求三类统计数据
      const [overviewRes, categoryRes, trendRes] = await Promise.all([
        wx.cloud.callFunction({
          name: 'getStatistics',
          data: { type: 'overview' }
        }),
        wx.cloud.callFunction({
          name: 'getStatistics',
          data: { type: 'category' }
        }),
        wx.cloud.callFunction({
          name: 'getStatistics',
          data: { type: 'trend' }
        })
      ]);

      // 处理总览数据
      console.log('getStatistics overview返回:', JSON.stringify(overviewRes.result));
      console.log('getStatistics category返回:', JSON.stringify(categoryRes.result));
      console.log('getStatistics trend返回:', JSON.stringify(trendRes.result));

      if (overviewRes.result && overviewRes.result.errMsg === 'cloud.callFunction:ok' && overviewRes.result.data) {
        const overview = overviewRes.result.data;
        overview.processRate = Math.round(overview.processRate);
        this.setData({ overview });
      }

      // 处理分类数据
      if (categoryRes.result && categoryRes.result.errMsg === 'cloud.callFunction:ok' && categoryRes.result.data) {
        const categoryStats = categoryRes.result.data.map(item => {
          return {
            ...item,
            categoryText: util.getCategoryText(item.category)
          };
        });
        this.setData({ categoryStats });
      }

      // 处理趋势数据
      if (trendRes.result && trendRes.result.errMsg === 'cloud.callFunction:ok' && trendRes.result.data) {
        const trendData = trendRes.result.data;
        const maxCount = trendData.reduce((max, item) => Math.max(max, item.count), 1);
        this.setData({
          trendData,
          maxCount: Math.max(maxCount, 1)
        });
      }

      this.setData({ loading: false, loaded: true });
    } catch (err) {
      console.error('加载统计数据失败', err);
      this.setData({ loading: false, loaded: true });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 转发
  onShareAppMessage() {
    return {
      title: '橡树湾·邻里 - 统计概览',
      path: '/pages/statistics/statistics'
    };
  },

  // 跳转到提交页
  goToSubmit() {
    wx.redirectTo({
      url: '/pages/submit/submit'
    });
  },

  // 跳转到列表页
  goToList() {
    wx.redirectTo({
      url: '/pages/list/list'
    });
  },

  // 保持在统计页
  goToStatistics() {
    // 已在统计页,无需跳转
  }
});
