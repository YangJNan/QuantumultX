/*
README：https://github.com/YangJNan/QuantumultX/tree/master/BoxJS
 */

const path1 = "serverConfig";
const path2 = "wareBusiness";
const path3 = "basicConfig";
const consolelog = false;
const url = $request.url;
const body = $response.body;
const $tool = tool();

if (url.indexOf(path1) != -1) {
    let obj = JSON.parse(body);
    delete obj.serverConfig.httpdns;
    delete obj.serverConfig.dnsvip;
    delete obj.serverConfig.dnsvip_v6;
    $done({ body: JSON.stringify(obj) });
}

if (url.indexOf(path3) != -1) {
    let obj = JSON.parse(body);
    let JDHttpToolKit = obj.data.JDHttpToolKit;
    if (JDHttpToolKit) {
        delete obj.data.JDHttpToolKit.httpdns;
        delete obj.data.JDHttpToolKit.dnsvipV6;
    }
    $done({ body: JSON.stringify(obj) });
}

if (url.indexOf(path2) != -1) {
    let obj = JSON.parse(body);
    const floors = obj.floors;
    const commodity_info = floors[floors.length - 1];
    const shareUrl = commodity_info.data.property.shareUrl;
    request_history_price(shareUrl, function (data) {
        if (data) {
            const lowerword = adword_obj();
            lowerword.data.ad.textColor = "#fe0000";
            let bestIndex = 0;
            for (let index = 0; index < floors.length; index++) {
                const element = floors[index];
                if (element.mId == lowerword.mId) {
                    bestIndex = index + 1;
                    break;
                } else {
                    if (element.sortId > lowerword.sortId) {
                        bestIndex = index;
                        break;
                    }
                }
            }
            if (data.ok == 1 && data.single) {
                const lower = lowerMsgs(data.single)
                const detail = priceSummary(data)
                const tip = data.PriceRemark.Tip + "（仅供参考）"
                lowerword.data.ad.adword = `${lower} ${tip}\n${detail}`;
                floors.insert(bestIndex, lowerword);
            }
            if (data.ok == 0 && data.msg.length > 0) {
                lowerword.data.ad.adword = "⚠️ " + data.msg;
                floors.insert(bestIndex, lowerword);
            }
            $done({ body: JSON.stringify(obj) });
        } else {
            $done({ body });
        }
    })
}

function lowerMsgs(data) {
    const lower = data.lowerPriceyh
    const lowerDate = dateFormat(data.lowerDateyh)
    const lowerMsg = "〽️历史最低到手价：¥" + String(lower) + ` (${lowerDate}) `
    return lowerMsg
}

function priceSummary(data) {
    let summary = ""
    let listPriceDetail = data.PriceRemark.ListPriceDetail
    listPriceDetail.pop()
    let list = listPriceDetail.concat(historySummary(data.single))
    list.forEach((item, index) => {
        if (item.Name == "双11价格") {
            item.Name = "双十一价格"
        } else if (item.Name == "618价格") {
            item.Name = "六一八价格"
        } else if (item.Name == "30天最低价") {
            item.Name = "三十天最低"
        }
        summary += `\n${item.Name}${getSpace(8)}${item.Price}${getSpace(8)}${item.Date}${getSpace(8)}${item.Difference}`
    })
    return summary
}

function historySummary(single) {
    const rexMatch = /\[.*?\]/g;
    const rexExec = /\[(.*),(.*),"(.*)".*\]/;
    let currentPrice, lowest60, lowest180, lowest360
    let list = single.jiagequshiyh.match(rexMatch);
    list = list.reverse().slice(0, 360);
    list.forEach((item, index) => {
        if (item.length > 0) {
            const result = rexExec.exec(item);
            const dateUTC = new Date(eval(result[1]));
            const date = dateUTC.format("yyyy-MM-dd");
            
