
//Tìm sản phẩm theo tên sản phẩm, màu sắc, kích thước
db.getCollection("products").aggregate([
    {
        $match: {
            name: { $regex: new RegExp(`^${name.replace(/\s+/g, "")}$`, "i") } // Bỏ khoảng trắng + không phân biệt hoa thường
        }
    },
    {
        $project: {
            _id: 1,
            name: 1,
            price: 1,
            total_number: 1,
            color: {
                $filter: {
                    input: "$array_color",
                    as: "color",
                    cond: nameColor
                        ? { $regexMatch: { input: { $replaceAll: { input: "$$color.name_color", find: " ", replacement: "" } }, regex: new RegExp(`^${nameColor.replace(/\s+/g, "")}$`, "i") } }
                        : {}
                }
            }
        }
    },
    { $unwind: { path: "$color", preserveNullAndEmptyArrays: true } },
    {
        $project: {
            _id: 1,
            name: 1,
            price: 1,
            total_number: 1,
            name_color: "$color.name_color",
            size: {
                $filter: {
                    input: "$color.array_sizes",
                    as: "size",
                    cond: nameSize
                        ? { $regexMatch: { input: { $replaceAll: { input: "$$size.name_size", find: " ", replacement: "" } }, regex: new RegExp(`^${nameSize.replace(/\s+/g, "")}$`, "i") } }
                        : {}
                }
            }
        }
    },
    { $unwind: { path: "$size", preserveNullAndEmptyArrays: true } },
    {
        $match: {
            $or: [
                { "size.total_number_with_size": { $gt: 0 } },
                { "color.total_number_with_color": { $gt: 0 } },
                { total_number: { $gt: 0 } }
            ]
        }
    },
    {
        $project: {
            _id: 1,
            name: 1,
            price: 1,
            total_number: 1,
            name_color: 1,
            name_size: "$size.name_size",
            quantity: {
                $cond: {
                    if: { $ifNull: ["$size.total_number_with_size", false] },
                    then: "$size.total_number_with_size",
                    else: "$color.total_number_with_color"
                }
            }
        }
    }
]);


db.getCollection("products").aggregate([
    {
        $match: {
            name: { $regex: new RegExp(`^Basic Hoodie$`, "i") } // Bỏ khoảng trắng + không phân biệt hoa thường
        }
    },
    {
        $project: {
            _id: 1,
            name: 1,
            price: 1,
            total_number: 1,
            color: {
                $filter: {
                    input: "$array_color",
                    as: "color",
                    cond: { $eq: ["$$color.name_color", "Vang"] }
                }
            }
        }
    },
    { $unwind: { path: "$color", preserveNullAndEmptyArrays: true } },
    {
        $project: {
            _id: 1,
            name: 1,
            price: 1,
            total_number: 1,
            name_color: "$color.name_color",
//            size: {
//                $filter: {
//                    input: "$color.array_sizes",
//                    as: "size",
//                    cond: {}
//                }
//            }
        }
    },
//    { $unwind: { path: "$size", preserveNullAndEmptyArrays: true } },
//    {
//        $match: {
//            $or: [
//                { "size.total_number_with_size": { $gt: 0 } },
//                { "color.total_number_with_color": { $gt: 0 } },
//                { total_number: { $gt: 0 } }
//            ]
//        }
//    },
//    {
//        $project: {
//            _id: 1,
//            name: 1,
//            price: 1,
//            total_number: 1,
//            name_color: 1,
//            name_size: "$size.name_size",
//            quantity: {
//                $cond: {
//                    if: { $ifNull: ["$size.total_number_with_size", false] },
//                    then: "$size.total_number_with_size",
//                    else: "$color.total_number_with_color"
//                }
//            }
//        }
//    }
]);