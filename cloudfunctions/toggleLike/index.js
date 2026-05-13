// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const issuesCollection = db.collection('issues')
const likesCollection = db.collection('likes')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { issueId } = event

    if (!issueId) {
      return { errMsg: 'cloud.callFunction:fail', error: '缺少问题ID' }
    }

    // 查询是否已点赞
    const likeResult = await likesCollection.where({
      issueId: issueId,
      userId: openid
    }).get()

    if (likeResult.data.length > 0) {
      // 已点赞 → 取消点赞
      await likesCollection.doc(likeResult.data[0]._id).remove()
      await issuesCollection.doc(issueId).update({
        data: {
          likeCount: _.inc(-1)
        }
      })
      return {
        errMsg: 'cloud.callFunction:ok',
        liked: false
      }
    } else {
      // 未点赞 → 点赞
      await likesCollection.add({
        data: {
          issueId: issueId,
          userId: openid,
          createTime: db.serverDate()
        }
      })
      await issuesCollection.doc(issueId).update({
        data: {
          likeCount: _.inc(1)
        }
      })
      return {
        errMsg: 'cloud.callFunction:ok',
        liked: true
      }
    }
  } catch (err) {
    console.error('点赞操作失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: '服务器内部错误'
    }
  }
}
