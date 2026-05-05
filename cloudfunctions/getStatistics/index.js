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
  try {
    const { type = 'overview' } = event
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    if (type === 'overview') {
      // 并行查询所有计数
      const [totalCount, monthCount, pendingCount, processingCount, completedCount] = await Promise.all([
        issuesCollection.count(),
        issuesCollection.where({ createTime: _.gte(monthStart) }).count(),
        issuesCollection.where({ status: 0 }).count(),
        issuesCollection.where({ status: 1 }).count(),
        issuesCollection.where({ status: 2 }).count()
      ])

      const total = totalCount.total
      const completed = completedCount.total
      const processRate = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        errMsg: 'cloud.callFunction:ok',
        data: {
          total: total,
          monthTotal: monthCount.total,
          pending: pendingCount.total,
          processing: processingCount.total,
          completed: completed.total,
          processRate: processRate
        }
      }
    } else if (type === 'category') {
      // 并行查询各分类计数
      const categories = ['environment', 'facility', 'safety', 'parking', 'other']
      const countResults = await Promise.all(
        categories.map(category => issuesCollection.where({ category }).count())
      )
      const categoryStats = categories.map((category, index) => ({
        category,
        count: countResults[index].total
      }))

      return {
        errMsg: 'cloud.callFunction:ok',
        data: categoryStats
      }
    } else if (type === 'trend') {
      // 并行查询近7天趋势
      const trendPromises = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        trendPromises.push(
          issuesCollection.where({
            createTime: _.gte(date).and(_.lt(nextDate))
          }).count().then(res => ({
            date: `${date.getMonth() + 1}-${date.getDate()}`,
            count: res.total
          }))
        )
      }
      const trendData = await Promise.all(trendPromises)

      return {
        errMsg: 'cloud.callFunction:ok',
        data: trendData
      }
    } else {
      return {
        errMsg: 'cloud.callFunction:fail',
        error: '未知的统计类型'
      }
    }

  } catch (err) {
    console.error('获取统计数据失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: '服务器内部错误'
    }
  }
}
