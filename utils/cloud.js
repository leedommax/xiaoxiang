// utils/cloud.js
const cloud = {
  /**
   * 调用云函数
   */
  callFunction: function(name, data = {}) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: name,
        data: data,
        success: res => {
          if (res.result.errMsg === 'cloud.callFunction:ok') {
            resolve(res.result.data);
          } else {
            reject(res.result);
          }
        },
        fail: err => {
          reject(err);
        }
      });
    });
  },

  /**
   * 上传图片到云存储
   */
  uploadFile: function(cloudPath, filePath) {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: res => {
          resolve(res.fileID);
        },
        fail: err => {
          reject(err);
        }
      });
    });
  },

  /**
   * 批量上传图片
   */
  uploadImages: async function(filePaths) {
    const uploadPromises = filePaths.map((filePath, index) => {
      const cloudPath = `images/${Date.now()}-${index}-${Math.random().toString(36).substr(2)}.jpg`;
      return this.uploadFile(cloudPath, filePath);
    });

    return Promise.all(uploadPromises);
  },

  /**
   * 获取云存储文件临时链接
   */
  getTempFileURL: function(fileIDs) {
    return new Promise((resolve, reject) => {
      wx.cloud.getTempFileURL({
        fileList: Array.isArray(fileIDs) ? fileIDs : [fileIDs],
        success: res => {
          resolve(res.fileList);
        },
        fail: err => {
          reject(err);
        }
      });
    });
  },

  /**
   * 删除云存储文件
   */
  deleteFile: function(fileIDs) {
    return new Promise((resolve, reject) => {
      wx.cloud.deleteFile({
        fileList: Array.isArray(fileIDs) ? fileIDs : [fileIDs],
        success: res => {
          resolve(res.fileList);
        },
        fail: err => {
          reject(err);
        }
      });
    });
  }
};

module.exports = cloud;
