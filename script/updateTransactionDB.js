//add field createAt to transactions collection
db.getCollection("transactions").aggregate([
    {
      $addFields: {
        createAt: { $toLong: "$create_date" } ,
      }
    }
 ]).toArray().forEach(function(item){
     db.getCollection("transactions").updateMany(
     { },
    { $set: { createAt: item.createAt} }
 )
 })

 // API lấy doanh thu theo tháng
 db.getCollection("transactions").aggregate([
  {
      $project: {
          price_pay: 1,
          year: { $year: "$create_date" },
          month: { $month: "$create_date" },
      },
  },
  {
      $group: {
          _id: {year : "$year", month: "$month"},
          revenue: { $sum : "$price_pay"}
      }
  }
])

// API lấy tổng doanh thu
db.getCollection("transactions").aggregate([
  {
      $group: {
          _id: null,
          totalRevenue: {$sum : "$price_pay"}
      },
  },
])