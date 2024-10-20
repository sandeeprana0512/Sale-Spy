import inquirer from "inquirer";
import axios from "axios";
import cheerio from "cheerio";
import twilio from "twilio";

const twilioInfo = {
    TWILIO_NUMBER: "",
    SID: "",
    AUTH_TOKEN: "",
};

const messenger = twilio(twilioInfo.SID, twilioInfo.AUTH_TOKEN);

const sendAlert = (twilioInfo, info) => {
    const alertMessage = `Amazon Alert!! ${info.REMINDER_MSG} (${info.AMAZON_URL})(${info.PRODUCT_NAME}) is available under ${info.DESIRED_PRICE}`

    messenger.messages
        .create({
            from: twilioInfo.TWILIO_NUMBER,
            to: info.MOBILE_NUMBER,
            body: alertMessage,
        })
        .then((res) => {
            console.log(res.body);
        });
};

let amazonHandle;

let productInfo = {
    AMAZON_URL: "",
    PRODUCT_NAME: "",
    REMINDER_MSG: "Buy Now!",
    DESIRED_PRICE: 0,
    COUNTRY_CODE: "",
    MOBILE_NUMBER: "",
    CHECK_INTERVAL: "1",
    PRICE: 0,
};


const questions = [
    {
        type: "input",
        name: "amazon_url",
        message: "Enter Amazon URL :",
    },
    {
        type: "input",
        name: "reminder_msg",
        message: "Enter Reminder Message :",
    },
    {
        type: "input",
        name: "desired_price",
        message: "Enter Desired Price :",
    },
    {
        type: "input",
        name: "mobile_number",
        message: "Enter Mobile Number with country code (+91xx) :",
    },
    {
        type: "input",
        name: "check_interval",
        message: "Enter Check Interval in (minutes) :",
    },
];

const amazonParser = async (info) => {
    const { data } = await axios.get(
        info.AMAZON_URL
    );
    const $ = cheerio.load(data);
    const item = $("div.a-section");
    const titleBox = $("div#titleSection");

    const title = $(titleBox)
        .find("h1#title")
        .first()
        .text()
        .replace(/[,.]/g, "");
    info.PRODUCT_NAME = title;

    const price = $(item)
        .find("span.a-price-whole")
        .first()
        .text()
        .replace(/[,.]/g, "");

    if (price <= parseInt(info.DESIRED_PRICE)) {
        sendAlert(twilioInfo, info);
        clearInterval(amazonHandle);
    }

    info.PRICE = parseInt(price);
};

const takeUserInput = (productInfo) => {
    inquirer.prompt(questions).then((answers) => {
        productInfo.AMAZON_URL = answers.amazon_url;
        productInfo.REMINDER_MSG = answers.reminder_msg;
        productInfo.DESIRED_PRICE = answers.desired_price;
        productInfo.EMAIL = answers.email;
        productInfo.CHECK_INTERVAL = parseInt((answers.check_interval)*60000);
        productInfo.MOBILE_NUMBER = answers.mobile_number;

        amazonHandle = setInterval(
            () => amazonParser(productInfo),
            productInfo.CHECK_INTERVAL
        );
    });
};

takeUserInput(productInfo);
