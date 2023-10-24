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

const HEX_DUMP_MESSAGE = "Perform slam poetry at the Hex Dump"
const LOGGERS_MESSAGE = "Collage your pencil shavings at Loggers Retreat"
const BREAKPOINT_MESSAGE = "Experience ego death as you stare into the big red dot at Breakpoint Vista"

async function register_all() {
    activeEndpoint = "prod"
    await register_building("0x34cf8a7e000000000000000000000000000000010000ffff", "TOWER", true, "", [
         '0x0', '0x01', '0x0', '0xffff'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fff9000afffd", "HEX_DUMP", false, HEX_DUMP_MESSAGE, [
        '0x0', '0xfff9', '0x0a', '0xfffd'
    ])
    await register_building("0x34cf8a7e000000000000000000000000000000050002fff9", "LOGGERS_RETREAT", false, LOGGERS_MESSAGE, [
        '0x0', '0x05', '0x02', '0xfff9'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fff400030009", "BREAKPOINT_VISTA", false, BREAKPOINT_MESSAGE, [
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
    await register_building("0x34cf8a7e0000000000000000000000000000fff8000afffe", "HEX_DUMP", false, HEX_DUMP_MESSAGE, [
        '0x0', '0xfff8', '0x0a', '0xfffe'
    ])
    await register_building("0x34cf8a7e000000000000000000000000000000050002fff9", "LOGGERS_RETREAT", false, LOGGERS_MESSAGE, [
        '0x0', '0x05', '0x02', '0xfff9'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fffcfffd0007", "BREAKPOINT_VISTA", false, BREAKPOINT_MESSAGE, [
        '0x0', '0xfffc', '0xfffd', '0x07'
    ])
}

// register_all()
register_all_local();


