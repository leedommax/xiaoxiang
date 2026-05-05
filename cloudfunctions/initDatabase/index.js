// 数据库初始化脚本
// 运行方式: 在云开发控制台的云函数中创建此函数并执行

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 初始化问题分类数据
async function initCategories() {
  const categories = [
    {
      name: '环境卫生',
      value: 'environment',
      icon: '🌿',
      sort: 1,
      status: 1,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    },
    {
      name: '设施维修',
      value: 'facility',
      icon: '🔧',
      sort: 2,
      status: 1,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    },
    {
      name: '安全隐患',
      value: 'safety',
      icon: '⚠️',
      sort: 3,
      status: 1,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    },
    {
      name: '停车管理',
      value: 'parking',
      icon: '🚗',
      sort: 4,
      status: 1,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    },
    {
      name: '其他',
      value: 'other',
      icon: '📝',
      sort: 5,
      status: 1,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  ]

  try {
    // 检查是否已存在
    const existData = await db.collection('categories').get()
    if (existData.data.length > 0) {
      console.log('分类数据已存在,跳过初始化')
      return { success: true, message: '分类数据已存在' }
    }

    // 批量插入
    const result = await db.collection('categories').add({
      data: categories
    })

    console.log('分类数据初始化成功', result)
    return { success: true, message: '分类数据初始化成功', data: result }
  } catch (err) {
    console.error('分类数据初始化失败', err)
    return { success: false, message: '初始化失败', error: err }
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 初始化分类数据
    const categoryResult = await initCategories()

    return {
      errMsg: 'cloud.callFunction:ok',
      data: {
        categories: categoryResult
      }
    }
  } catch (err) {
    console.error('数据库初始化失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: err
    }
  }
}
