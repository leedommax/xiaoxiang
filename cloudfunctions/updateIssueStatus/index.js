const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { issueId, remark } = event;

  // 参数校验
  if (!issueId) {
    return { errMsg: '参数错误：缺少issueId' };
  }
  if (!remark || !remark.trim()) {
    return { errMsg: '请填写处理备注' };
  }
  if (remark.length > 500) {
    return { errMsg: '备注不能超过500字' };
  }

  try {
    // 先查询当前状态，确保是待处理
    const issueRes = await db.collection('issues').doc(issueId).get();
    if (!issueRes.data || issueRes.data.status !== 0) {
      return { errMsg: '该问题当前状态不可处理' };
    }

    // 更新状态为已处理
    await db.collection('issues').doc(issueId).update({
      data: {
        status: 2,
        remark: remark.trim(),
        processTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return { errMsg: 'cloud.callFunction:ok' };
  } catch (err) {
    console.error('更新问题状态失败', err);
    return { errMsg: '更新失败，请重试' };
  }
};
