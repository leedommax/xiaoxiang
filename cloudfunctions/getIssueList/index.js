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

  try {
    let {
      filter = 'all',
      status,
      phase,
      page = 0,
      pageSize = 20
    } = event

    // 参数校验
    page = Math.max(0, Math.min(parseInt(page) || 0, 500))
    pageSize = Math.max(1, Math.min(parseInt(pageSize) || 20, 100))

    // 构建查询条件
    let query = {}

    if (filter === 'mine') {
      query.userId = wxContext.OPENID
    }

    if (status !== undefined && status !== '') {
      const statusNum = parseInt(status)
      if ([0, 1, 2, 3].includes(statusNum)) {
        query.status = statusNum
      }
    }

    if (phase && phase.trim() !== '') {
      query.phase = phase.trim()
    }

    // 查询总数
    const countResult = await issuesCollection.where(query).count()

    // 查询列表（先按点赞数降序，再按时间降序）
    const listResult = await issuesCollection
      .where(query)
      .orderBy('likeCount', 'desc')
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .field({
        userId: true,
        userName: true,
        category: true,
        description: true,
        images: true,
        location: true,
        phase: true,
        buildingNo: true,
        urgency: true,
        status: true,
        createTime: true,
        remark: true,
        likeCount: true
      })
      .get()

    // 查询当前用户对列表中问题的点赞状态
    const openid = wxContext.OPENID
    const issueIds = listResult.data.map(item => item._id)
    let likedMap = {}
    if (issueIds.length > 0) {
      try {
        const likedResult = await likesCollection.where({
          issueId: _.in(issueIds),
          userId: openid
        }).get()
        likedResult.data.forEach(item => {
          likedMap[item.issueId] = true
        })
      } catch (likeErr) {
        console.error('查询点赞状态失败', likeErr)
      }
    }

    // 附加 liked 字段和 likeCount 默认值
    const list = listResult.data.map(item => ({
      ...item,
      likeCount: item.likeCount || 0,
      liked: !!likedMap[item._id]
    }))

    return {
      errMsg: 'cloud.callFunction:ok',
      data: {
        list: list,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        hasMore: (page + 1) * pageSize < countResult.total
      }
    }
  } catch (err) {
    console.error('获取问题列表失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: err.message || err.toString()
    }
  }
}
