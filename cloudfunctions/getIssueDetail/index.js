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

    // 查询问题详情
    const result = await issuesCollection.doc(issueId).get()

    return {
      errMsg: 'cloud.callFunction:ok',
      data: result.data
    }
  } catch (err) {
    console.error('获取问题详情失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: '服务器内部错误'
    }
  }
}
