const util = require('../../utils/util.js');
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    categories: [
      { label: '环境卫生', value: 'environment' },
      { label: '设施维修', value: 'facility' },
      { label: '安全隐患', value: 'safety' },
      { label: '停车管理', value: 'parking' },
      { label: '其他', value: 'other' }
    ],
    selectedCategory: '',
    description: '',
    imageList: [],
    location: '',
    urgency: 0,
    submitting: false
  },

  onLoad() {
    // 确保已登录
    const app = getApp();
    if (!app.globalData.openid) {
      app.login();
    }
  },

  // 选择问题分类
  selectCategory(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      selectedCategory: value
    });
  },

  // 问题描述输入
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    const maxCount = 9 - this.data.imageList.length;
    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        // 压缩图片后再添加
        const compressedFiles = [];
        for (const file of res.tempFiles) {
          try {
            const compressRes = await util.compressImage(file.tempFilePath, 80);
            compressedFiles.push(compressRes.tempFilePath);
          } catch (e) {
            // 压缩失败则使用原图
            compressedFiles.push(file.tempFilePath);
          }
        }
        this.setData({
          imageList: [...this.data.imageList, ...compressedFiles]
        });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.imageList
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const imageList = this.data.imageList.filter((item, i) => i !== index);
    this.setData({
      imageList
    });
  },

  // 位置信息输入
  onLocationInput(e) {
    this.setData({
      location: e.detail.value
    });
  },

  // 选择紧急程度
  selectUrgency(e) {
    const urgency = e.currentTarget.dataset.urgency;
    this.setData({
      urgency
    });
  },

  // 表单验证
  validateForm() {
    if (!this.data.selectedCategory) {
      wx.showToast({
        title: '请选择问题分类',
        icon: 'none'
      });
      return false;
    }
    if (!this.data.description.trim()) {
      wx.showToast({
        title: '请输入问题描述',
        icon: 'none'
      });
      return false;
    }
    if (!this.data.location.trim()) {
      wx.showToast({
        title: '请输入位置信息',
        icon: 'none'
      });
      return false;
    }
    return true;
  },

  // 提交
  async submit() {
    if (!this.validateForm()) {
      return;
    }

    if (this.data.submitting) {
      return;
    }

    this.setData({
      submitting: true
    });

    try {
      wx.showLoading({
        title: '提交中...',
        mask: true
      });

      // 上传图片到云存储
      let cloudImageIds = [];
      if (this.data.imageList.length > 0) {
        const results = await Promise.allSettled(
          this.data.imageList.map((filePath, index) => {
            const cloudPath = `images/${Date.now()}-${index}-${Math.random().toString(36).substr(2)}.jpg`;
            return cloud.uploadFile(cloudPath, filePath);
          })
        );
        // 只保留上传成功的图片
        cloudImageIds = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value);
      }

      // 获取用户信息
      const app = getApp();
      const userInfo = app.globalData.userInfo || {};

      // 提交问题
      const submitRes = await wx.cloud.callFunction({
        name: 'submitIssue',
        data: {
          category: this.data.selectedCategory,
          description: this.data.description,
          images: cloudImageIds,
          location: this.data.location,
          urgency: this.data.urgency
        }
      });

      // 检查云函数业务层是否成功
      if (!submitRes.result || submitRes.result.errMsg !== 'cloud.callFunction:ok') {
        const errMsg = submitRes.result ? submitRes.result.error : '提交失败';
        throw new Error(errMsg);
      }

      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });

      // 提交成功后跳转到列表页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/list/list'
        });
      }, 1500);

    } catch (err) {
      wx.showToast({
        title: JSON.stringify(err),
        icon: 'success'
      });
      console.error('提交失败', err);
      wx.hideLoading();
      // wx.showToast({
      //   title: '提交失败,请重试1111',
      //   icon: 'none'
      // });
      this.setData({
        submitting: false
      });
    }
  },

  // 转发
  onShareAppMessage() {
    return {
      title: '橡树湾·邻里 - 问题反馈',
      path: '/pages/submit/submit'
    };
  },

  // 跳转到列表页
  goToList() {
    wx.redirectTo({
      url: '/pages/list/list'
    });
  },

  // 保持在提交页
  goToSubmit() {
    // 已在提交页,无需跳转
  },

  // 跳转到统计页
  goToStatistics() {
    wx.redirectTo({
      url: '/pages/statistics/statistics'
    });
  }
});
