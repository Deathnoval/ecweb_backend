const Product = require('../models/product');
const Category = require('../models/category');

const chatbotResponse = async (req, res) => {
    console.log(req.body);
    const queryResult = req?.body?.queryResult;
    const intent = queryResult?.intent?.displayName;
    if (intent === "productStatus") {
        const parameters = queryResult?.parameters;
        const productSize = parameters?.productSize;
        const productColor = parameters?.productColor;
        const productName = parameters?.productName;
        console.log(productSize, productColor, productName);
        try {
            const product = await productStatus(productSize, productColor, productName);
            console.log(product);
            return res.json(product);
        } catch (err) {
            console.log(err);
        }
    } else if (intent === "categoryStatus") {
        const parameters = queryResult?.parameters;
        const productCategory = parameters?.productCategory;
        try {
            const category = await categoryStatus(productCategory);
            return res.json(category);
        } catch (err) {
            console.log(err);
        }
    }
}

const productStatus = async (productSize, productColor, productName) => {
    const product = await Product.aggregate(
        [
            {
                $match: {
                    name: { $regex: new RegExp(`^${productName.trim()}$`, "i") } // Bỏ khoảng trắng + không phân biệt hoa thường
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price: 1,
                    total_number: 1,
                    primary_image: 1,
                    color: {
                        $filter: {
                            input: "$array_color",
                            as: "color",
                            cond: productColor
                                ? {
                                    $regexMatch: {
                                        input: {
                                            $trim: { input: "$$color.name_color" } // Chỉ bỏ khoảng trắng đầu và cuối
                                        },
                                        regex: new RegExp(`.*${productColor.trim()}.*`, "i") // Chứa từ khóa, không cần chính xác toàn bộ
                                    }
                                }
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
                    primary_image: 1,
                    name_color: "$color.name_color",
                    size: {
                        $filter: {
                            input: "$color.array_sizes",
                            as: "size",
                            cond: productSize
                                ? {
                                    $regexMatch: {
                                        input: {
                                            $trim: { input: "$$size.name_size" } // Chỉ bỏ khoảng trắng đầu và cuối
                                        },
                                        regex: new RegExp(`.*${productSize.trim()}.*`, "i") // Chứa từ khóa, không cần chính xác toàn bộ
                                    }
                                }
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
                    primary_image: 1,
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
        ]
    );
    return formatProductInfo(product);
}

const categoryStatus = async (productCategory) => {
    const keywords = productCategory.trim().split(/\s+/);
    const searchConditions = keywords.map(word => ({
        $or: [
            { name: { $regex: word, $options: "i" } }, // Tìm trong danh mục chính
            { "sub_category.name": { $regex: word, $options: "i" } } // Tìm trong danh mục con
        ]
    }));
    console.log(searchConditions);
    const category = await Category.findOne({
        $or: searchConditions
    })
    console.log(category);
    return formatCategoryInfo(category);
}

const formatProductInfo = (products) => {
    if (!products || products.length === 0) {
        return {
            richContent: [[{ type: "description", text: ["Không tìm thấy sản phẩm nào."] }]]
        };
    }

    const { name, price, total_number } = products[0];

    // Gom nhóm theo màu sắc
    const colorMap = {};
    products.forEach(({ name_color, name_size, quantity }) => {
        if (!colorMap[name_color]) {
            colorMap[name_color] = [];
        }
        if (name_size && quantity !== undefined) {
            colorMap[name_color].push(`${name_size}: ${quantity} cái`);
        }
    });

    // Xây dựng mảng text
    let responseText = [
        `Sản phẩm: ${name}`,
        "",
        `Giá: ${price.toLocaleString()} VND`,
        "",
        `Tổng số lượng còn: ${total_number}`,
        ""
    ];

    Object.entries(colorMap).forEach(([color, sizes]) => {
        responseText.push(`Màu sắc: ${color}`);
        responseText.push("Kích thước & số lượng:");
        responseText = responseText.concat(sizes);
        responseText.push(""); // Dòng trống giữa các màu sắc
    });

    // Trả về response với 2 card messages
    return {
        fulfillmentMessages: [
            {
                "payload": {
                    "richContent": [
                        [
                            {
                                type: "description",
                                text: responseText
                            },
                            {
                                "type": "info",
                                "title": `${products[0]?.name}`,
                                "subtitle": `Giá: ${products[0]?.price.toLocaleString()} VND`,
                                "image": {
                                    "src": {
                                        "rawUrl": `${products[0]?.primary_image?.url}`
                                    }
                                },
                                "actionLink": `http://localhost:3000/product-detail/${products[0]?._id}`
                            }
                        ]
                    ]
                }
            },
        ]
    };
}

const formatCategoryInfo = (category) => {
    if (category === null) {
        return {
            fulfillmentMessages: [
                {
                    "text": {
                        "text": [
                            "Không tìm thấy danh mục phù hợp."
                        ]
                    }
                }
            ]
        };
    }

    // Chip cho danh mục chính
    const categoryChip = {
        text: `${category?.name}`,
        link: `http://localhost:3000/products/${category?.category_id}`
    };

    // Chips cho subcategories
    const subcategoryChips = category?.sub_category.map(sub => ({
        text: `${sub?.name}`,
        link: `http://localhost:3000/products/${sub?.sub_category_id}`
    }));

    return {
        fulfillmentMessages: [
            {
                "text": {
                    "text": [
                        `Danh mục tìm thấy: ${category?.name}`
                    ]
                }
            },
            {
                payload: {
                    richContent: [
                        [
                            { type: "chips", options: [categoryChip, ...subcategoryChips] }
                        ]
                    ]
                }
            }
        ]
    };
}

function isEmptyString(str) {
    return !str || str.trim().length === 0;
}

module.exports = {
    chatbotResponse,
}