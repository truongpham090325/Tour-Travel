const AccountAdmin = require("../../models/account-admin.model");
const Order = require("../../models/order.model");
const Tour = require("../../models/tour.model");
const {
  paymentMethodList,
  paymentStatusList,
  statusList,
  pathAdmin,
} = require("../../config/variable.config");
const moment = require("moment");

module.exports.dashboard = async (req, res) => {
  // Thông số tổng quan
  const overview = {
    totalAdmin: 0,
    totalOrder: 0,
    totalRevenue: 0,
  };

  overview.totalAdmin = await AccountAdmin.countDocuments({
    deleted: false,
  });

  const orderList = await Order.find({
    deleted: false,
  }).limit(5);

  for (const orderDetail of orderList) {
    orderDetail.paymentMethodName = paymentMethodList.find(
      (item) => item.value == orderDetail.paymentMethod,
    ).label;

    orderDetail.paymentStatusName = paymentStatusList.find(
      (item) => item.value == orderDetail.paymentStatus,
    ).label;

    orderDetail.createdAtTime = moment(orderDetail.createdAt).format("HH:mm");
    orderDetail.createdAtDate = moment(orderDetail.createdAt).format(
      "DD/MM/YYYY",
    );

    for (const item of orderDetail.items) {
      const infoTour = await Tour.findOne({
        _id: item.tourId,
      });

      if (infoTour) {
        item.avatar = infoTour.avatar;
        item.name = infoTour.name;
      }
    }
  }

  overview.totalOrder = orderList.length;

  overview.totalRevenue = orderList.reduce(
    (total, item) => total + item.total,
    0,
  );

  res.render("admin/pages/dashboard", {
    pageTitle: "Tổng quan",
    overview: overview,
    orderList: orderList,
  });
};

module.exports.revenueChartPost = async (req, res) => {
  const { currentMonth, currentYear, previousMonth, previousYear, arrayDay } =
    req.body;

  // Truy vấn tất cả đơn hàng trong tháng hiện tại
  const orderCurrentMonth = await Order.find({
    deleted: false,
    createdAt: {
      $gte: new Date(currentYear, currentMonth - 1, 1),
      $lt: new Date(currentYear, currentMonth, 1),
    },
  });

  // Truy vấn tất cả đơn hàng trong tháng trước
  const orderPreviousMonth = await Order.find({
    deleted: false,
    createdAt: {
      $gte: new Date(previousYear, previousMonth - 1, 1),
      $lt: new Date(previousYear, previousMonth, 1),
    },
  });

  // Tạo mảng doanh thu theo từng ngày
  const dataMonthCurrent = [];
  const dataMonthPrevious = [];
  for (const day of arrayDay) {
    // Tính doanh thu theo ngày của tháng hiện tại
    let revenueCurrent = 0;
    for (const order of orderCurrentMonth) {
      const orderDate = new Date(order.createdAt).getDate();
      if (orderDate == day) {
        revenueCurrent += order.total;
      }
    }
    dataMonthCurrent.push(revenueCurrent);

    // Tính doanh thu theo ngày của tháng trước
    let revenuePrevious = 0;
    for (const order of orderPreviousMonth) {
      const orderDate = new Date(order.createdAt).getDate();
      if (orderDate == day) {
        revenuePrevious += order.total;
      }
    }
    dataMonthPrevious.push(revenuePrevious);
  }

  res.json({
    code: "success",
    message: "Thành công!",
    dataMonthCurrent: dataMonthCurrent,
    dataMonthPrevious: dataMonthPrevious,
  });
};
