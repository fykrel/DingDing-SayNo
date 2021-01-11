importClass(android.provider.Settings);
importClass(android.content.Context);
/* --------------------------------------预配置开始----------------------------------- */
const { serverUrl, companyName, morTime, nightTime, tokenUrl, maxTime, waitTime, pwd, isSendImg, account, accountPwd, jumpRules } = hamibot.env;
var myLog = "";
var myStr = "";
const w = device.width;
const h = device.height;
const maxSwipeNum = 50;
const holidayUrl = "http://timor.tech/api/holiday/year?week=Y";
const holidayCfgName = "HOLIDAY_ARRAY_" + new Date().getFullYear() + "_";
// 息屏时间/2
const loopTime = getLoopTime();
var myCfg = storages.create("DingDing-SayNo");

/**
 * 防止息屏
 */
threads.start(function () {
    setInterval(() => {
        toast("防止锁屏");
    }, loopTime);
});

if (!morTime) {
    toastLog("请设置上班打卡时间范围");
    exitShell();
}

if (!nightTime) {
    toastLog("请设置下班打卡时间范围");
    exitShell();
}

if (!maxTime) {
    toastLog("请设置打卡随机时间");
    exitShell();
}

if (!waitTime) {
    toastLog("请设置等待时间");
    exitShell();
}
//上班打卡时间段
var goToWorkTime = morTime.split(';');

//下班打卡时间段
var afterWorkTime = nightTime.split(';');

// 设置当年的节假日
if ("rule_1" == jumpRules && !myCfg.contains(holidayCfgName)) {
    setholiday();
}
/* --------------------------------------预配置结束----------------------------------- */

startProgram();

/**
 * 脚本流程
 */
function startProgram() {
    unlockIfNeed();
    sleep(waitTime * 1000);
    // 1.检查权限
    checkMyPermission();
    // 2.进入页面
    goToPage();
    handleOrgDialog();
    // 3.获取操作并执行
    var randTime = random(10, maxTime);
    toast(randTime + "s后开始打卡");
    setLog(randTime + "s后开始打卡");
    sleep(randTime * 1000);
    punchTheClock();
    // 4.获取结果
    getReslt();
    // 5.返回给用户
    exitShell();
}

/**
 * 手机是否锁屏
 */
function isLocked() {
    var km = context.getSystemService(Context.KEYGUARD_SERVICE);
    return km.isKeyguardLocked() && km.isKeyguardSecure();
}

/**
 * 根据当前自动息屏时间获取循环时间
 */
function getLoopTime() {
    let lockTime = Settings.System.getInt(context.getContentResolver(), Settings.System.SCREEN_OFF_TIMEOUT);
    if (null == lockTime || "" == lockTime || "undefined" == lockTime) {
        return 8000;
    }
    return lockTime / 2;
}

/**
 * 获取今年的所有节假日
 */
function setholiday() {
    setLog("获取当年节假日数据");
    let res = http.get(holidayUrl, {});
    let jsonObj = JSON.parse(res.body.string());
    if (jsonObj.code == -1) {
        setLog("获取节假日数据失败");
        exitShell();
    }

    let holiday = jsonObj.holiday;
    let holidayArray = [];
    if (holiday) {
        for (let key in holiday) {
            if (holiday[key].holiday) {
                holidayArray.push(holiday[key].date);
            }
        }
        myCfg.put(holidayCfgName, holidayArray);
    }
}

/**
 * 解锁屏幕
 */
function unlockIfNeed() {
    device.wakeUpIfNeeded();
    if (!isLocked()) {
        setLog("无需解锁");
        return;
    }
    sleep(1000);
    // 上滑操作
    swipeUp();
    if (pwd) {
        enterPwd();
    }
    setLog("解锁完毕");
}

/**
 * 上滑至输入密码界面
 */
function swipeUp() {
    if (myCfg.contains("CFG_SWIPE_TIME_")) {
        const CFG_SWIPE_TIME_ = myCfg.get("CFG_SWIPE_TIME_");
        gesture(CFG_SWIPE_TIME_, [w / 2, h * 0.9], [w / 2, h * 0.1]);
        sleep(1000);
        if (swipeUpSuc()) {
            return;
        }
    }

    if (swipeUpMethodOne()) {
        log("方式一解锁成功");
    } else if (swipeUpMethodTwo()) {
        log("方式二解锁成功");
    } else {
        setLog("暂时无法解锁");
        exitShell();
    }
}

/**
 * 上滑方式一
 */
function swipeUpMethodOne() {
    var xyArr = [220];
    var x0 = w / 2;
    var y0 = h / 4 * 3;
    var angle = 0;
    var x = 0;
    var y = 0;
    for (let i = 0; i < 30; i++) {
        y = x * tan(angle);
        if ((y0 - y) < 0) {
            break;
        }
        var xy = [x0 + x, y0 - y];
        xyArr.push(xy);
        x += 5;
        angle += 3;
    }
    gesture.apply(null, xyArr);
    function tan(angle) {
        return Math.tan(angle * Math.PI / 180);
    }
    return swipeUpSuc();
}

/**
 * 上滑方式二
 */
function swipeUpMethodTwo() {
    let swipeTime = 0;
    let addTime = 20;
    for (let i = 0; i < maxSwipeNum; i++) {
        swipeTime += addTime;
        gesture(swipeTime, [w / 2, h * 0.9], [w / 2, h * 0.1]);
        sleep(1000);
        if (swipeUpSuc()) {
            myCfg.put("CFG_SWIPE_TIME_", swipeTime);
            return true;
        }
    }
    return false;
}

/**
 * 判断上滑结果
 */
function swipeUpSuc() {
    for (let i = 0; i < 10; i++) {
        if (!text(i).clickable(true).exists() && !desc(i).clickable(true).exists()) {
            return false;
        }
    }
    return true;
}

/**
 * 输入手机解锁密码
 */
function enterPwd() {
    //点击
    if (text(0).clickable(true).exists()) {
        for (var i = 0; i < pwd.length; i++) {
            a = pwd.charAt(i)
            sleep(200);
            text(a).clickable(true).findOne().click()
        }
    } else {
        for (var i = 0; i < pwd.length; i++) {
            a = pwd.charAt(i)
            sleep(200);
            desc(a).clickable(true).findOne().click()
        }
    }
}

/**
 * 是否需要登录
 */
function loginIfNeed() {
    if (text("密码登录").clickable(true).exists()) {
        text("密码登录").clickable(true).findOne().click();
    } else if (desc("密码登录").clickable(true).exists()) {
        desc("密码登录").clickable(true).findOne().click();
    }

    if (text("忘记密码").clickable(true).exists() || desc("忘记密码").clickable(true).exists()) {
        if (!account || !accountPwd) {
            setLog("当前未登录，请输入钉钉登录账号及密码");
            exitShell();
        }

        if (id("et_phone_input").exists() && id("et_pwd_login").exists()) {
            id("et_phone_input").findOne().setText(account);
            sleep(1000);
            id("et_pwd_login").findOne().setText(accountPwd);
            log("使用ID选择输入");
        } else {
            setText(0, account);
            sleep(1000);
            setText(1, accountPwd);
            log("使用setText输入");
        }
        //获取登录按钮坐标
        if (text("忘记密码").clickable(true).exists()) {
            var loginBtnY = text("忘记密码").clickable(true).findOne().bounds().top - 10;
        } else {
            var loginBtnY = desc("忘记密码").clickable(true).findOne().bounds().top - 10;
        }
        click(w / 2, loginBtnY);
        setLog("登录成功");
    } else {
        setLog("已登录");
    }
}

/**
 * 上传截图至SMMS
 */
function uploadImg() {
    toastLog("上传打卡截图...");
    const url = "https://sm.ms/api/v2/upload";
    const fileName = "/sdcard/" + new Date().getTime() + ".png";
    captureScreen(fileName);

    let res = http.postMultipart(url, {
        smfile: open(fileName)
    }, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
        }
    });

    let jsonObj = JSON.parse(res.body.string());
    let isSuc = jsonObj.success;
    let imgUrl = jsonObj.data.url;
    let delUrl = jsonObj.data.delete;
    if (isSuc) {
        setLog("手机截图删除结果：" + ((files.remove(fileName) ? "成功" : "失败")));
        setLog("图床图片删除链接：");
        setLog(delUrl);
        setLog("打卡结果截图");
        myLog += '![logo](' + imgUrl + ')';
    } else {
        setLog("图片上传失败~");
    }
}

/**
 * 获取打卡结果
 */
function getReslt() {
    toastLog("等待10s，确保打卡操作完毕");
    sleep(10000);
    toastLog("识别打卡结果");

    try {
        if (textContains("打卡成功").exists() || descContains("打卡成功").exists()) {
            setLog("普通识别结果：" + myStr + "成功!");
        } else {
            setLog("普通识别结果：" + myStr + "失败!，扣你丫工资~");
        }
        if (tokenUrl) {
            let str = getContentByOcr();
            if (str.indexOf("打卡成功") !== -1) {
                setLog("OCR识别结果：" + myStr + "成功!");
            } else {
                setLog("OCR识别结果：" + myStr + "失败!，扣你丫工资~");
            }
        }
        if (isSendImg) {
            uploadImg();
        }
    } catch (error) {
        setLog("识别打卡结果出错：" + '\n\n' + error.message);
    }
    back();
    back();
}

/**
 * 调用百度文字识别ocr得到当前手机截屏文字
 */
function getContentByOcr() {
    let img = captureScreen();
    access_token = http.get(tokenUrl).body.json().access_token;
    let url = "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic" + "?access_token=" + access_token;
    let imag64 = images.toBase64(img);
    let res = http.post(url, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, image: imag64, image_type: "BASE64" });
    str = JSON.parse(res.body.string()).words_result.map(val => val.words).join();
    return str;
}

/**
 * 打卡
 */
function punchTheClock() {
    setLog("当前操作：" + myStr);
    waitBtnShow();
    if (text(myStr).clickable(true).exists()) {
        text(myStr).clickable(true).findOne().click();
    }
    if (desc(myStr).clickable(true).exists()) {
        desc(myStr).clickable(true).findOne().click();
    }
}

/**
 * 等待进入钉钉登录界面或者主界面
 */
function waitStart() {
    let sTime = new Date().getTime();
    let delay = 30000;

    while ((new Date().getTime() - sTime) < delay) {
        if (text("忘记密码").exists() || desc("忘记密码").exists() ||
            text("工作台").exists() || desc("工作台").exists() ||
            text("密码登录").exists() || desc("密码登录").exists()) {
            break;
        }
        sleep(1000);
    }
}

/**
 * 等待打卡按钮出现
 */
function waitBtnShow() {
    let sTime = new Date().getTime();
    let delay = 60000;

    while ((new Date().getTime() - sTime) < delay) {
        if (textContains("已进入").exists() || descContains("已进入").exists()) {
            break;
        }
        sleep(1000);
    }
}

/**
 * 获取当前时间，格式:2019/11/26 15:32:27
 */
function getDateTime(e) {
    var date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    if (month < 10) {
        month = "0" + month;
    }
    if (day < 10) {
        day = "0" + month;
    }
    if (e) {
        return year + '年' + month + '月' + day + '日' + hour + ':' + minute + ':' + second;
    }
    return year + '-' + month + '-' + day;
}

/**
 * 发送日志并退出脚本
 */
function exitShell() {
    if (serverUrl) {
        sendMsg(getDateTime(true) + " 打卡结果", myLog);
    }
    home();
    exit();
}

/**
 * 通过server酱推送消息
 * @param {*} title 标题
 * @param {*} msg 内容
 */
function sendMsg(title, msg) {
    let url = "https://sc.ftqq.com/" + serverUrl + ".send";
    var res = http.post(url, {
        "text": title,
        "desp": msg
    });
}

/**
 * 保存日志
 * @param {*} msg 
 */
function setLog(msg) {
    log(msg);
    msg += '\n\n';
    myLog += msg;
}

/**
 * 根据当前时间返回是上班打卡，还是下班打卡
 */
function getOptByTime() {
    let now = new Date();
    let yearStr = (now.getFullYear()) + "/" + (now.getMonth() + 1) + "/" + (now.getDate()) + ' ';

    for (i = 0; i < goToWorkTime.length; i++) {
        let e = goToWorkTime[i];
        let morStartTime = e.split('-')[0];
        let morEndTime = e.split('-')[1];
        //上班打卡时间段->时间类型
        let morStart = new Date(yearStr + morStartTime);
        let morEnd = new Date(yearStr + morEndTime);
        //判断当前时间是否可以进行上班打卡
        if (now > morStart && now < morEnd) {
            return "上班打卡";
        }
    }

    for (j = 0; j < afterWorkTime.length; j++) {
        let e = afterWorkTime[j];
        let nightStartTime = e.split('-')[0];
        let nightEndTime = e.split('-')[1];
        //下班打卡时间段->时间类型
        let nightStart = new Date(yearStr + nightStartTime);
        let nightEnd = new Date(yearStr + nightEndTime);
        //判断当前时间是否可以进行下班打卡
        if (now > nightStart && now < nightEnd) {
            return "下班打卡";
        }
    }

    return -1;
}

/**
 * 钉钉可能加入了多个公司，通过意图进入打卡页面会提示选择
 */
function handleOrgDialog() {
    if ("" == companyName || null == companyName) {
        return;
    }
    let delay = 30000;
    const flagStr = "请选择你要进入的考勤组织";
    let sTime = new Date().getTime();
    while ((new Date().getTime() - sTime) < delay) {
        if (text(flagStr).exists() || desc(flagStr).exists()) {
            if (textContains(companyName).clickable(true).exists()) {
                textContains(companyName).findOne().click();
                setLog("选择公司：" + companyName);
                return;
            }
            if (descContains(companyName).clickable(true).exists()) {
                descContains(companyName).findOne().click();
                setLog("选择公司：" + companyName);
                return;
            }
        } else {
            sleep(1000);
        }
    }
}

/**
 * 打开打卡页面
 */
function goToPage() {
    toastLog("打开钉钉中...");
    launch("com.alibaba.android.rimet");
    waitStart();
    log("启动完成");
    loginIfNeed();
    sleep(waitTime * 1000);
    setLog("进入打卡页面");
    var a = app.intent({
        action: "VIEW",
        data: "dingtalk://dingtalkclient/page/link?url=https://attend.dingtalk.com/attend/index.html"
    });
    app.startActivity(a);
}

/**
 * 检查权限
 */
function checkMyPermission() {
    // 1.检查当前是否是打卡时间段
    myStr = getOptByTime();
    if (-1 === myStr) {
        setLog("当前时间不在设置的考勤范围内!!!");
        exitShell();
    }

    // 2.根据配置跳过节假日或周末
    if ("rule_1" == jumpRules) {
        let holidayArray = myCfg.get(holidayCfgName);
        if (holidayArray.indexOf(getDateTime(false)) != -1) {
            setLog("今天是节假日, 不会打卡哦~");
            exitShell();
        }
    } else if ("rule_2" == jumpRules) {
        let week = new Date().getDay();
        if (week == 6 || week == 0) {
            setLog("今天是周末, 不会打卡哦~");
            exitShell();
        }
    }

    // 3.检查无障碍权限
    if (auto.service == null) {
        setLog("请打开无障碍服务,脚本退出！！！");
        sleep(3000);
        app.startActivity({ action: "android.settings.ACCESSIBILITY_SETTINGS" });
        exitShell();
    }

    // 4.请求截图权限
    if (tokenUrl || isSendImg) {
        // 自动点击申请截图权限时的按钮
        threads.start(function () {
            let timer = setInterval(function () {
                if (text("立即开始").clickable(true).exists()) {
                    text("立即开始").clickable(true).findOne().click();
                    clearInterval(timer);
                } else if (desc("立即开始").clickable(true).exists()) {
                    desc("立即开始").clickable(true).findOne().click();
                    clearInterval(timer);
                }
            }, 500);
        });

        if (!requestScreenCapture()) {
            setLog("申请截图权限失败");
            exitShell();
        }
    }

    toastLog("权限检查完毕");
}
