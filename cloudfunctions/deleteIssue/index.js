// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const issuesCollection = db.collection('issues')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const { issueId } = event

    if (!issueId) {
      return { errMsg: 'cloud.callFunction:fail', error: '缺少问题ID' }
    }

    // 先查询该问题，确认存在且属于当前用户
    const issueRes = await issuesCollection.doc(issueId).get()
    const issue = issueRes.data

    if (issue.userId !== wxContext.OPENID) {
      return { errMsg: 'cloud.callFunction:fail', error: '无权删除此问题' }
    }

    // 删除云存储中的图片
    if (issue.images && issue.images.length > 0) {
      try {
        await cloud.deleteFile({
          fileList: issue.images
        })
      } catch (e) {
        console.error('删除图片失败', e)
      }
    }

    // 删除数据库记录
    await issuesCollection.doc(issueId).remove()

    return {
      errMsg: 'cloud.callFunction:ok',
      data: { deleted: true }
    }
  } catch (err) {
    console.error('删除问题失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: '服务器内部错误'
    }
  }
}
