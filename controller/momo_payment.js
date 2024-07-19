const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const partnerCode = 'MOMO';
const accessKey = 'F8BBA842ECF85';
const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

const generateSignature = (rawData, secretKey) => {
    return crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');
};

const createPayment = async (orderId, amount, orderInfo, deliveryInfo) => {
    const requestId = partnerCode + orderId;

    const orderType = 'momo_wallet';
    const requestType = 'captureWallet';
    amount = amount.toString()
    const redirectUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b';
    const ipnUrl = process.env.IPNURL.toString() + '/api/V1/order/callback';
    console.log(ipnUrl)
    const rawData = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + '' + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;

    const signature = generateSignature(rawData, secretKey);

    const body = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        lang: 'vi',
        extraData: '',
        requestType,
        signature,
        deliveryInfo,
        orderExpireTime: 10,
    };

    try {
        const response = await axios.post(endpoint, body);
        return response.data;
    } catch (error) {
        console.error('Error creating MoMo payment:', error);
        throw error;
    }
};
const check_status_momo_payment = async (orderId) => {
    const requestId = partnerCode + orderId;

    const rawData = "accessKey=" + accessKey + "&orderId=" + orderId + "&partnerCode=" + partnerCode + "&requestId=" + requestId;
    console.log(rawData);
    const signature = generateSignature(rawData, secretKey);
    const body = {
        partnerCode: 'MOMO',
        requestId: requestId,
        orderId: orderId,
        signature: signature,
        lang: 'vi',
    }
    console.log(body)
    const url = 'https://test-payment.momo.vn/v2/gateway/api/query'

    try {
        const response = await axios.post(url, body)
        return response.data;
    }
    catch (error) {
        console.error('Error reading momo payment');
        throw error;
    }
}


module.exports = {
    createPayment,
    check_status_momo_payment
};
