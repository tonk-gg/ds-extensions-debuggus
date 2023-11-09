import ds from 'downstream';

var game, tonkPlayer;
let bugging = false;
let player_to_bug = null;
let complete_task = false;
let perform_function = false;
let first_click_in = true;
let confirmed = false;

let ENDPOINT = "http://localhost:8082"
// let ENDPOINT = "https://ds-api.tonk.gg"

async function getGame() {
    try {
        let response = await fetch(`${ENDPOINT}/game`);
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
        return (`{ "status": "GameServerDown" }`)
    }
}

async function getPlayer(id) {
    try {
        let response = await fetch(`${ENDPOINT}/player/${id}`)
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
    }
}

function isInGame(players, playerId) {
    return players.findIndex((p) => p.id == playerId) !== -1;
}

async function getPlayers(gameId, playerId) {
    try {
        let response = await fetch(`${ENDPOINT}/game/${gameId}/player?player_id=${playerId}`);
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getResult() {
    try {
        let response = await fetch(`${ENDPOINT}/game/result`)
        let text = await response.text();
        return JSON.parse(text);
    } catch (e) {
        console.log(e);
    }
}

async function getLastRoundResult(game) {
    //TODO implement 
    console.log("tonk getLastRound", game.time.round-1)
    try {
        let lastRound = game.time.round - 1;
        let response = await fetch(`${ENDPOINT}/game/result/${lastRound}`)
        let text = await response.text();
        return JSON.parse(text);
    } catch (e) {
        console.log(e);
}
}

async function registerPlayer(id, mobileUnitId, displayName, hash, secret) {
    var raw = JSON.stringify({
        id: id, 
        mobile_unit_id: mobileUnitId,
        display_name: displayName 
    })
    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: raw
      };
      
      try {
        // let response = await fetch(`${ENDPOINT}/player/${id}?secret_key=${secret}&onchain_hash=${hash}`, requestOptions)
        let response = await fetch(`${ENDPOINT}/player/${id}`, requestOptions)
        // let text = await response.text();
      } catch (e) {
        console.log(e);
      }
}

async function getTask(player) {
    try {
        let response = await fetch(`${ENDPOINT}/task?player_id=${player.id}&secret_key=fff`);
        let text = await response.text();
        return JSON.parse(text);
    } catch (e) {
        console.log(e);
    }
}

async function postTask(task, player) {
    var raw = JSON.stringify(task);
    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: raw
      };
      
      try {
        let response = await fetch(`${ENDPOINT}/task?player_id=${player.id}&secret_key=fff`, requestOptions)
      } catch (e) {
        console.log(e);
      }
}

async function postAction(target, game, player, confirmed) {
    var raw = JSON.stringify({
        poison_target: target,
        round: game.time.round,
        confirmed,
        interrupted_task: false 
    })
    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: raw
      };
      
      try {
        let response = await fetch(`${ENDPOINT}/action?player_id=${player.id}&secret_key=fff`, requestOptions)
      } catch (e) {
        console.log(e);
      }
}

function reasonToPlaintext(p) {
    console.log(p);
    const { reason, player } = p; 
    if (reason == "BuggedOut") {
        return `has been eliminated and ${player.role == "Bugged" ? 'was an evil unit' : 'was a noble unit'}`;
    } else if (reason == "VotedOut") {
        return `has been voted out and ${player.role == "Bugged" ? 'was an evil unit' : 'was a noble unit'}`;
    } else if (reason == "Inaction") {
        return `was ${player.role == "Bugged" ? 'an evil unit' : 'a noble unit'} and has been eliminated due to inaction`
    } else {
        return "has been swallowed by an error!"
    }
}

function buildingIdToDirections(readableId) {
    switch(readableId) {
        case "HEX_DUMP": {
            return { at: "North", with: "with the gears and pipes"};
        }
        case "SELFIE_POINT": {
            return {at: "West", with: "with the umbrella on top"};
        }
        case "MEME_GEN": {
            return {at: "East", with: "with the steamed ham ontop"};
        }
        default: {
            return "";
        }
    }
}

function formatHtml(status, game, player, players, task, lastRoundResult) {
    let the_other_bugs = []; 
    if (players.length > 0 && typeof players[0].role !== 'undefined') {
        players.map((p) => {
            if (p.role == "Bugged" && p.id !== player.id) {
                the_other_bugs.push(p);
            }
        })
    }
    let the_other_bugs_html = the_other_bugs.length > 0 ? `<p style="font-weight: bold"> Pssst, the other evil units are: 
        ${the_other_bugs.map((bugs,i) => {
            if (i == 0) {
                return bugs.display_name;
            } else {
                return ", " + bugs.display_name;
            }
        })}</p>` : "";

    if (status == "SPECTATOR") {
        return `
            <p> Please go to the Tonk Tower to join the game </p>
        `
    } else if (status == "ELIMINATED") {
        return `
            <p> You have been eliminated! You can watch the game progress at the Tonk Tower </p>
        `;
    } else if (status == "Lobby") {
        return `
            <h3>Lobby</h3>
            <p> Waiting for the game to start... </p>
        `
    } else if (status == "Tasks") {
        if (player.role && player.role == "Bugged") {
            return `
                <h3> Complete the Task </h3>
                <h3>Time remaining: ${game.time.timer}</h3>
                <br/>
                ${the_other_bugs_html}
                </br>
                ${player.used_action == "TaskComplete" ? (
                    `<p> Ok, great work you evil unit you. Now, try to act normal!`
                ) : player.used_action == "ReturnToTower" ? (
                    `<p> You did the attack. Now you must return to the tower to confirm the dastardly deed.`
                ) : (
                    `<p> <span style="font-weight: bold">Objective:</span> ${task.destination.task_message} </p></br>${
                        player.proximity.immune ? (
                            "<p> Your attack power is useless within 3 tiles of the Tower </p> "
                        ) : (
                            player.proximity.nearby_players && player.proximity.nearby_players.length == 0 ? (
                                `<p> There are no nearby players to attack. You must be within 2 tiles to attack someone. </p>`
                            ) : ""
                        )
                    }`
                )}
            `
        } else {
            let directions = buildingIdToDirections(task.destination.readable_id);
            let second_directions = buildingIdToDirections(task.second_destination.readable_id);
            return `
                <h3> Complete the Task </h3>
                <h3>Time remaining: ${game.time.timer}</h3>
                <br/>
                ${task.complete ? (
                    `<p> Objective Complete! Take a well-deserved rest until the next round </p>`
                ) : task.dropped_off_second ? (
                    `<p> <span style="font-weight: bold">Objective:</span> Return to the Tower to complete the task! </p>`
                ) : task.dropped_off ? (
                    `<p style="font-weight: bold"> Now go to the second destination: </p>
                    <p> At the building ${second_directions.at} of the tower, ${second_directions.with}! </p>
                    <p> <span style="font-weight: bold">Objective:</span> ${task.second_destination.task_message} </p>`
                ) : (
                    `
                    <p style="font-weight: bold"> Go to your first destination: </p>
                    <p> At the building ${directions.at} of the tower, ${directions.with}! </p>
                    <p> <span style="font-weight: bold">Objective:</span> ${task.destination.task_message} </p>`
                )}
                <br/>
                <p> [Failure will result in your deletion. Thank you for your cooperation.] </p>
            `
        }
    } else if (status == "TaskResult") {
        return `
            <h3> Tasks complete </h3>
            <h3>Time remaining: ${game.time.timer}</h3>
            ${player.role && player.role == "Bugged" ? `${the_other_bugs_html}</br>` : ""}
            <br/>
            <p> Return back to the tower to see results! </p>
        `;
    } else if (status == "Vote") {
        return `
            <h3> Vote </h3>
            <h3>Time remaining: ${game.time.timer}</h3>
            <br/>
            ${player.role && player.role == "Bugged" ? `${the_other_bugs_html}</br>` : ""}
            <p> Go to the tower and submit your vote! </p> <br/>
            <p style="font-weight: bold"> Results of the last task round: </p>
            ${lastRoundResult.eliminated && lastRoundResult.eliminated.length > 0 ? "<p> Player deletion report: </p><br/>" : "<p>Somehow, you all have avoided deletion.</p>"}
            ${lastRoundResult.eliminated && lastRoundResult.eliminated.length > 0 ? lastRoundResult.eliminated.map((p) => `<p>${p.player.display_name} ${reasonToPlaintext(p)}</p>`) : ""}
            <br/>
            <p> [Indecision will result in your deletion. Thank you for your cooperation.] </p>
        `;
    } else if (status == "VoteResult") {
        return `
            <h3> Votes counted </h3>
            <h3>Time remaining: ${game.time.timer}</h3>
            ${player.role && player.role == "Bugged" ? `${the_other_bugs_html}</br>` : ""}
            <br/>
            <p style="font-weight: bold"> The tower is announcing the result </p>
        `;
    } else if (status == "End") {
        return `
            <h3> Game Over </h3>
            <h3>Time until next game lobby: ${game.time.timer}</h3>
            <br/>
            <p> Victory! Return to the tower to play again </p>
        `;
    }
}

function inlineStyle(style) {
    return Object.keys(style).map(key => {
        return `${key}:${style[key]}`
    }).join(';');
} 

function showNotification(proximity) {
    let nearbyPlayers = proximity ? proximity.nearby_players : [];
    let container = {
        position: 'fixed',
        display: 'inline-block',
        bottom: '3.6rem',
        right: '2.4rem',
        "min-height": '4rem',
        "max-height": '20rem',
        padding: '1.2rem',
        "background-color": 'white',
        transition: 'bottom 1s ease-in, opacity 0.6s ease-in',
        "border-radius": "1.2rem",
        border: "#0D090F 3px solid"
    };
    return `
        <div style="${inlineStyle(container)}">
            ${nearbyPlayers ? nearbyPlayers.length == 0 ? (
                "No one is nearby"
            ) : (
                nearbyPlayers.map((n) =>`<p>${n.display_name}</p>`).join('\n')
            ) : "No one is nearby"}
        <div>
    `
}

// export default async function update(params) {
//     const { selected, player } = params;
//     const { mobileUnit } = selected || {};

//     game = await getGame();
//     tonkPlayer = await getPlayer(player.id);

//     let task = "";
//     let buttons = [];

//     const bugOut = (id, displayName) => {
//         bugging = true;
//         player_to_bug = {
//             id,
//             display_name: displayName,
//         }
//     }

//     const confirmBug = () => {
//         bugging = true;
//         confirmed = true;
//         player_to_bug = {
//             id: tonkPlayer.id,
//             display_name: "fake"
//         };
//     }

//     const completeTask = () => {
//         complete_task = true;
//     }

//     const performFunction = () => {
//         perform_function = true;
//     }

//     if (bugging) {
//         await postAction(player_to_bug, game, tonkPlayer, confirmed);
//         bugging = false;
//         player_to_bug = null;
//         confirmed = false;
//     }

//     let players = await getPlayers(game.id, player.id);
//     let has_joined = isInGame(players, player.id);
//     let status = has_joined ? game.status : "SPECTATOR";
//     let lastRoundResult = null;

//     let nameField = mobileUnit.name || { value: `UNIT ${mobileUnit.key.replace("0x", "").toUpperCase()}`}
//     if (!tonkPlayer || tonkPlayer.id == "" || first_click_in) {
//         await registerPlayer(player.id, mobileUnit.id, nameField.value);
//         first_click_in = false;
//     } else if (tonkPlayer.display_name != nameField.value) {
//         await registerPlayer(player.id, mobileUnit.id, nameField.value);
//     }

//     let playerEliminated = false;
//     if (status == "VoteResult") {
//         let result = await getResult();
//         playerEliminated = result.eliminated && result.eliminated.findIndex(p => p.player.id == tonkPlayer.id) >= 0;
//     }

//     status = tonkPlayer.eliminated || playerEliminated ? "ELIMINATED" : status;

//     if (status == "Tasks") {
//         buttons = [];
//         task = await getTask(tonkPlayer);
//         if (tonkPlayer.role == "Bugged") {
//             if (tonkPlayer.proximity.nearby_players && tonkPlayer.proximity.nearby_players.length != 0 && tonkPlayer.used_action == "Unused") {
//                 tonkPlayer.proximity.nearby_players.forEach((p) => {
//                     if (!p.proximity.immune && p.role !== "Bugged") {
//                         buttons.push(
//                             { text: `Bug ${p.display_name}`, type: 'action', action: bugOut.bind(this, p.id, p.display_name), disabled: false }
//                         )
//                     }
//                 });
//             }
//             let isNearTower = tonkPlayer.proximity && tonkPlayer.proximity.nearby_buildings && tonkPlayer.proximity.nearby_buildings.filter(b => b.is_tower).length > 0
//             if (tonkPlayer.used_action == "ReturnToTower" && isNearTower) {
//                 buttons = [
//                     {
//                         text: `Confirm Attack`,
//                         type: 'action',
//                         action: confirmBug.bind(this), 
//                         disabled: false
//                 }];
//             }
//         } else {
//             if (complete_task) {
//                 await postTask(task, tonkPlayer);
//                 complete_task = false;
//             }
//             if (perform_function) {
//                 await postTask(task, tonkPlayer);
//                 perform_function = false;
//             }
//             if (tonkPlayer.proximity.nearby_buildings && tonkPlayer.proximity.nearby_buildings.findIndex((b) => b.id == task.destination.id) >= 0 && !task.dropped_off) {
//                 buttons = [
//                     { text: 'Perform function', type: 'action', action: performFunction, disabled: perform_function }
//                 ];
//             }
//             if (tonkPlayer.proximity.nearby_buildings && tonkPlayer.proximity.nearby_buildings.findIndex((b) => b.id == task.second_destination.id) >= 0 && !task.dropped_off_second && task.dropped_off) {
//                 buttons = [
//                     { text: 'Perform function', type: 'action', action: performFunction, disabled: perform_function }
//                 ];
//             }
//             if (tonkPlayer.proximity.nearby_buildings && tonkPlayer.proximity.nearby_buildings.findIndex((b) => b.is_tower) >= 0 && !task.complete && task.dropped_off && task.dropped_off_second) {
//                 buttons = [
//                     { text: 'Complete task', type: 'action', action: completeTask, disabled: complete_task }
//                 ];
//             }
//         }
//     }

//     if (status == "Vote") {
//         lastRoundResult = await getLastRoundResult(game);
//     }

//     return {
//         version: 1,
//         components: [
//             {
//                 id: 'tonk',
//                 type: 'item',
//                 content: [
//                     {
//                         id: 'default',
//                         type: 'inline',
//                         html: `
//                             ${formatHtml(status, game, tonkPlayer, players, task, lastRoundResult)}
//                             ${showNotification(tonkPlayer.proximity)}
//                         `,
//                         buttons
//                     },
//                 ],
//             },
//         ],
//     };
// }

const containerStyle = {
    width: "100%",
}

const screenContainerStyle = {
    width: "260px",
    "max-width": "260px",
    height: "123px",
    "max-height": "123px",
    "border-radius": "15px",
    overflow: "hidden",
    background: "black",
    position: "absolute",
}

const miniScreenContainerStyle = {
    width: "260px",
    "max-width": "260px",
    height: "53px",
    "max-height": "53px",
    "border-radius": "15px",
    overflow: "hidden",
    background: "black",
    position: "absolute",
  }

const screenGradientStyle = {
    width: "260px",
    "max-width": "260px",
    height: "128px",
    "max-height": "128px",
    position: "absolute",
    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.50) 5.22%, rgba(255, 255, 255, 0.38) 14.06%, rgba(255, 255, 255, 0.00) 100%)"
}

const lowerGlareStyle = {
    position: "absolute",
    top: "94px",
    transform: "rotate(180deg)",
    width: "250px",
    "max-width": "250px",
    height: "34px",
    "max-height": "34px",
    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.30) 5.22%, rgba(255, 255, 255, 0.23) 21.88%, rgba(255, 255, 255, 0.00) 100%)",
    filter: "blur(7px)",
}
const upperGlareStyle = {
    width: "250px",
    "max-width": "250px",
    height: "34px",
    "max-height": "34px",
    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.30) 5.22%, rgba(255, 255, 255, 0.23) 21.88%, rgba(255, 255, 255, 0.00) 100%)",
    filter: "blur(7px)",
}

const logoStyle = {
    width: "260px",
    position: "absolute",
    top: "2px",
    left: "1px",
}

const screenRow = {
    display: "block",
    width: "100%",
    height: "123px",
    position: "absolute",
    top: 0,
    left: 0
}

const miniGradient = {
    height: "53px",
    "max-height": "53px",
}

const miniGlare = {
    height: "17px",
    "max-height": "17px",
}

const bigTextStyle ={
    "font-family": "Recursive, monospace",
    "font-size": "25px",
    "font-style": "normal",
    "font-weight": 500,
}

const roleTextStyle = {
    color: "#E47740",
    "text-shadow": "-2px -2px 3px rgba(228, 119, 66, 0.50), 2px 2px 2px rgba(228, 119, 63, 0.50)",
    "line-height": "34px",
    height: "53px",
    top: 0,
    position: "absolute",
    margin: "0 0 0 5px",
    padding: "10px",
    width: "100%"
}

const rowStyle = {
    display: "block",
    width: "100%",
    height: "120px",
    "margin-top": "12px"
}
const labelStyle = {
    "font-family": "Recursive, monospace",
    "font-size": "18px",
    "font-weight": "700",
    margin: 0,
    padding: 0,
    "max-width": "130px",
}
const boxAndLabelStyle = {
    margin: 0,
    padding: 0,
    display: "inline-block",
}
const boxStyle = {
    display: "inline-block",
    "border-radius": "5px",
    background: "#EDEBF6",
    border: "1px solid #A7A3AF",
    "box-shadow": "-1px -1px 0px 0px #EDEBF6",
    margin: "5px",
}

const statusStyle = {
    "min-width": "215px",
    "max-width": "215px",
    "min-height": "75px",
    "max-height": "75px",
}

const directionsStyle = {
    "min-width": "215px",
    "max-width": "215px",
    "min-height": "53px",
    "max-height": "53px",
}

const timeStyle = {
    "min-width": "94px",
    "max-width": "94px",
    "min-height": "75px",
    "max-height": "75px",
}

const entryStyle = {
    "font-weight": 800,
    "font-size": "14px",
    margin: "5px",
}

const timeTextStyle = {
    "font-weight": 800,
    "font-size": "28px",
    color: "#F66723",
    margin: "15px 0",
    padding: 0,
    "text-align": "center"
}

const warningTextStyle = {
    color: "#A19BAD",
    "font-family": "Recursive, monospace",
    "font-size": "18px",
    "font-weight": "500",
    "text-align": "center"
}

let nearbyPlayersContainer = {
    position: 'fixed',
    display: 'inline-block',
    bottom: '3.6rem',
    right: '2.4rem',
    "min-height": '4rem',
    padding: '1.2rem',
    "background-color": 'white',
    transition: 'bottom 1s ease-in, opacity 0.6s ease-in',
    "border-radius": "1.2rem",
    border: "#0D090F 3px solid",
    "max-width": "350px"
};

let playerFlexBox = {
    display: 'flex',
    position: 'relative',
    "max-width": "100%",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "max-height": "265px",
}

export function renderNearbyPlayers() {
    return `
        <div style="${inlineStyle(nearbyPlayersContainer)}">
            <p style="${inlineStyle({...labelStyle, "max-width": "100%"})}">Nearby Units</p>
            <p style="${inlineStyle({...warningTextStyle, width: "100%", "text-align": "left"})}">Units within this range are a danger to you.</p>
            <div style="${inlineStyle(playerFlexBox)}">
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
                <p style="${inlineStyle(entryStyle)}">Goblin Oats</p>
            </div>
        </div>
    `
}

export function renderInformation() {
    return `
    <div style="${inlineStyle({...rowStyle, height: "175px", margin: "0px 0 25px 0", display: "flex", "align-items": "center", "justify-content": "center", "max-height": "220px"})}">
        <p style="${inlineStyle({...warningTextStyle, "max-width": "264px"})}">waiting to receive instructions...</p>
    </div>
    `
}

export function renderLastRoundInformation() {
    return `
<div style="${inlineStyle(rowStyle)}">
    <div style="${inlineStyle(boxAndLabelStyle)}">
        <p style="${inlineStyle({...labelStyle, width: "100%"})}">LAST ROUND SUMMARY</p>
        <div style="${inlineStyle({...boxStyle, ...statusStyle, "overflow-y": "scroll"})}"> 
            <p style="${inlineStyle(entryStyle)}">Goblin Oats — failed to act.</p>
            <p style="${inlineStyle(entryStyle)}">Goblin Oats — failed to act.</p>
            <p style="${inlineStyle(entryStyle)}">Goblin Oats — failed to act.</p>
            <p style="${inlineStyle(entryStyle)}">Goblin Oats — failed to act.</p>
            <p style="${inlineStyle(entryStyle)}">Goblin Oats — failed to act.</p>
        </div>
    </div>
</div>
    `
}

export function renderDirections() {
    return `
    <div style="${inlineStyle(rowStyle)}">
        <div style="${inlineStyle(boxAndLabelStyle)}">
            <p style="${inlineStyle(labelStyle)}">DIRECTIONS</p>
            <div style="${inlineStyle({...boxStyle, ...directionsStyle, background: "#F00"})}"> 
                <p style="${inlineStyle({...bigTextStyle, "font-size": "22px", "text-align": "center", "line-height": "50px"})}">DATA DUMP NORTH</p>
            </div>
        </div>
    </div>
    `
}

export function renderDefault() {
    return `
<div style="${inlineStyle({...screenRow, transform: "translateY(-176px)"})}">
    <div style="${inlineStyle(screenContainerStyle)}">
        <div style="${inlineStyle(screenGradientStyle)}"></div>
        <div style="${inlineStyle(upperGlareStyle)}"></div>
        <div style="${inlineStyle(lowerGlareStyle)}"></div>
        <img src="https://d19un6ckffnywj.cloudfront.net/tonk-attack-transparent-logo.gif" style="${inlineStyle(logoStyle)}" />
    </div>
</div>
<div style="${inlineStyle({...screenRow, transform: "translateY(-53px)", height: "53px"})}">
    <div style="${inlineStyle(miniScreenContainerStyle)}">
        <div style="${inlineStyle({...screenGradientStyle, ...miniGradient})}"></div>
        <div style="${inlineStyle({...upperGlareStyle, ...miniGlare })}"></div>
        <div style="${inlineStyle({...lowerGlareStyle, ...miniGlare, top: "36px" })}"></div>
        <p style="${inlineStyle({...bigTextStyle, ...roleTextStyle})}">...ROLE...PENDING..</p>
    </div>
</div>
<div style="${inlineStyle({...screenRow, transform: "translate(254px, 1px)", height: "106px"})}">
    <div style="${inlineStyle({...boxAndLabelStyle, transform: "translateY(0)"})}">
        <p style="${inlineStyle({...labelStyle, ...boxStyle, display: "block", margin: 0})}">TIME (sec)</p>
        <div style="${inlineStyle({...boxStyle, ...timeStyle, margin: "0"})}"> 
            <p style="${inlineStyle(timeTextStyle)}">180</p>
        </div>
    </div>
</div>
<div style="${inlineStyle(rowStyle)}">
    <div style="${inlineStyle(boxAndLabelStyle)}">
        <p style="${inlineStyle(labelStyle)}">GAME STATUS</p>
        <div style="${inlineStyle({...boxStyle, ...statusStyle})}"> 
            <p style="${inlineStyle(entryStyle)}">Units are currently doing their tasks</p>
        </div>
    </div>
</div>
    `
}
export default async function update(params) {
    return {
        version: 1,
        components: [
            {
                id: 'tonk',
                type: 'item',
                content: [
                    {
                        id: 'default',
                        type: 'inline',
                        html: `
                        <div style="${inlineStyle(containerStyle)}">
                            ${renderDefault()}
                            ${renderLastRoundInformation()}
                            ${renderInformation()}
                        </div>
                        ${renderNearbyPlayers()}
                        `,
                    },
                ],
            },
        ],
    };
}