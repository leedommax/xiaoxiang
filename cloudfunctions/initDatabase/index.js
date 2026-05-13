// 数据库初始化脚本
// 运行方式: 在云开发控制台的云函数中创建此函数并执行

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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

// 初始化 likes 集合
async function initLikesCollection() {
  try {
    // 尝试查询，集合不存在会报错
    await db.collection('likes').limit(1).get()
    console.log('likes 集合已存在')
    return { success: true, message: 'likes 集合已存在' }
  } catch (err) {
    // 集合不存在，通过插入再删除一条记录来创建集合
    try {
      const addResult = await db.collection('likes').add({
        data: {
          issueId: '__init__',
          userId: '__init__',
          createTime: db.serverDate()
        }
      })
      await db.collection('likes').doc(addResult._id).remove()
      console.log('likes 集合创建成功')
      return { success: true, message: 'likes 集合创建成功' }
    } catch (createErr) {
      console.error('likes 集合创建失败', createErr)
      return { success: false, message: 'likes 集合创建失败', error: createErr }
    }
  }
}

// 迁移 issues 集合，补全 phase/buildingNo 字段
async function migrateIssuesFields() {
  try {
    const MAX_LIMIT = 100
    let migrated = 0

    // 分页查询缺少 phase 字段的记录
    async function migrateBatch(skip = 0) {
      const result = await db.collection('issues')
        .where({
          phase: _.exists(false)
        })
        .skip(skip)
        .limit(MAX_LIMIT)
        .get()

      if (result.data.length === 0) return

      for (const item of result.data) {
        await db.collection('issues').doc(item._id).update({
          data: {
            phase: '',
            buildingNo: ''
          }
        })
        migrated++
      }

      // 还有更多数据，继续迁移
      if (result.data.length === MAX_LIMIT) {
        await migrateBatch(skip + MAX_LIMIT)
      }
    }

    await migrateBatch()
    console.log(`issues 字段迁移完成，共迁移 ${migrated} 条`)
    return { success: true, message: `迁移完成，共 ${migrated} 条记录补全 phase/buildingNo` }
  } catch (err) {
    console.error('issues 字段迁移失败', err)
    return { success: false, message: '迁移失败', error: err }
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 初始化分类数据
    const categoryResult = await initCategories()
    // 初始化 likes 集合
    const likesResult = await initLikesCollection()
    // 迁移 issues 字段
    const migrateResult = await migrateIssuesFields()

    return {
      errMsg: 'cloud.callFunction:ok',
      data: {
        categories: categoryResult,
        likes: likesResult,
        migrate: migrateResult
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
