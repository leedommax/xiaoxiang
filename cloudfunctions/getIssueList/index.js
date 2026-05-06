// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const issuesCollection = db.collection('issues')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    let {
      filter = 'all',
      status,
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

    // 查询总数
    const countResult = await issuesCollection.where(query).count()

    // 查询列表
    const listResult = await issuesCollection
      .where(query)
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
        urgency: true,
        status: true,
        createTime: true,
        remark: true
      })
      .get()

    return {
      errMsg: 'cloud.callFunction:ok',
      data: {
        list: listResult.data,
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
      error: '服务器内部错误'
    }
  }
}
