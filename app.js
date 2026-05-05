// app.js
App({
  globalData: {
    userInfo: null,
    openid: null
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'production-d7g0oq5hs337da26a',
        traceUser: true,
      });
    }

    // 微信静默登录
    this.login();
  },

  // 微信静默登录
  login: function(retryCount) {
    retryCount = retryCount || 0;
    wx.cloud.callFunction({
      name: 'userLogin',
      data: {}
    }).then(res => {
      console.log('登录成功', res.result);
      if (res.result && res.result.openid) {
        this.globalData.openid = res.result.openid;
        this.globalData.userInfo = res.result.userInfo;
      }
    }).catch(err => {
      console.error('登录失败', err);
      // 自动重试，最多3次
      if (retryCount < 3) {
        setTimeout(() => {
          this.login(retryCount + 1);
        }, 2000);
      }
    });
  }
});
