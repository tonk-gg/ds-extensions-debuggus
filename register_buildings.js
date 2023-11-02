let ENDPOINT_LOCAL = "http://localhost:8082";
let ENDPOINT = "https://ds-api.tonk.gg"

let activeEndpoint = "local";

async function register_building(id, readable_id, is_tower, message, location) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "id": id,
        "is_tower": is_tower,
        "task_message": message,
        "readable_id": readable_id,
        location,
    });

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    let endpoint = activeEndpoint == "local" ? ENDPOINT_LOCAL : ENDPOINT
    return fetch(`${endpoint}/building`, requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error))

}

const HEX_DUMP_MESSAGE = "Pick up a big pile of garbage data at the Hex Dump"
const MEME_GEN_MESSAGE = "Prepare your steamed hams at the Meme Generator"
const SELFIE_POINT_MESSAGE = "Find your best angle at Selfie Point"

async function register_all() {
    activeEndpoint = "prod"
    await register_building("0x34cf8a7e000000000000000000000000000000010000ffff", "TOWER", true, "", [
         '0x0', '0x01', '0x0', '0xffff'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fff9000afffd", "HEX_DUMP", false, HEX_DUMP_MESSAGE, [
        '0x0', '0xfff9', '0x0a', '0xfffd'
    ])
    await register_building("0x34cf8a7e000000000000000000000000000000090002fff5", "MEME_GEN", false, MEME_GEN_MESSAGE, [
        '0x0', '0x09', '0x02', '0xfff5'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fff400030009", "SELFIE_POINT", false, SELFIE_POINT_MESSAGE, [
        '0x0', '0xfff4', '0x03', '0x09'
    ])
}
// async function register_all() {
//     activeEndpoint = "prod"
//     await register_building("0x34cf8a7e000000000000000000000000000000010000ffff",true, "", [
//         '0x0', '0x01', '0x0', '0xffff'
//     ])
//     await register_building("0x34cf8a7e0000000000000000000000000000fff9000afffd",false, HEX_DUMP_MESSAGE, [
//         '0x0', '0xfff9', '0x0a', '0xfffd'
//     ])
//     await register_building("0x34cf8a7e000000000000000000000000000000050002fff9",false, LOGGERS_MESSAGE, [
//         '0x0', '0x05', '0x02', '0xfff9'
//     ])
//     await register_building("0x34cf8a7e0000000000000000000000000000fff400030009",false, BREAKPOINT_MESSAGE, [
//         '0x0', '0xfff4', '0x03', '0x09'
//     ])
// }

async function register_all_local() {
    activeEndpoint = "local"
    await register_building("0x34cf8a7e000000000000000000000000000000010000ffff", "TOWER", true, "", [
        '0x0', '0x01', '0x0', '0xffff'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fff9000afffd", "HEX_DUMP", false, HEX_DUMP_MESSAGE, [
        '0x0', '0xfff9', '0x0a', '0xfffd'
    ])
    await register_building("0x34cf8a7e000000000000000000000000000000050002fff9", "MEME_GEN", false, MEME_GEN_MESSAGE, [
        '0x0', '0x05', '0x02', '0xfff9'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fffbfffe0007", "SELFIE_POINT", false, SELFIE_POINT_MESSAGE, [
        '0x0', '0xfffb', '0xfffe', '0x07'
    ])
}

register_all()
// register_all_local();


