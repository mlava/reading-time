
let hashChange = undefined;
var wpm, minutes, seconds;
let observer = undefined;

export default {
    onload: ({ extensionAPI }) => {
        const config = {
            tabTitle: "Reading Time",
            settings: [
                {
                    id: "rt-wpm",
                    name: "Words per Minute",
                    description: "Reading rate in words per minute",
                    action: {
                        type: "input", placeholder: "238",
                        onChange: (evt) => { wpm = evt.target.value; checkRT(); }
                    },
                },
            ]
        };
        extensionAPI.settings.panel.create(config);

        async function initiateObserver() {
            const targetNode1 = document.getElementsByClassName("rm-topbar")[0];
            const config = { attributes: false, childList: true, subtree: true };
            const callback = function (mutationsList, observer) {
                for (const mutation of mutationsList) {
                    if (mutation.addedNodes[0]) {
                        for (var i = 0; i < mutation.addedNodes[0]?.classList.length; i++) {
                            if (mutation.addedNodes[0]?.classList[i] == "rm-open-left-sidebar-btn") { // left sidebar has been closed
                                checkRT();
                            }
                        }
                    } else if (mutation.removedNodes[0]) {
                        for (var i = 0; i < mutation.removedNodes[0]?.classList.length; i++) {
                            if (mutation.removedNodes[0]?.classList[i] == "rm-open-left-sidebar-btn") { // left sidebar has been opened
                                checkRT();
                            }
                        }
                    }
                }
            };
            observer = new MutationObserver(callback);
            observer.observe(targetNode1, config);
        }
        initiateObserver();

        if (extensionAPI.settings.get("rt-wpm")) {
            const regex = /^[0-9]{2,3}$/;
            if (extensionAPI.settings.get("rt-wpm").match(regex)) {
                wpm = extensionAPI.settings.get("rt-wpm");
            } else {
                sendConfigAlert();
            }
        } else {
            wpm = "238"; // Brysbaert M. How many words do we read per minute? A review and meta-analysis of reading rate. 2019. doi:10.31234/osf.io/xynwg.
        }

        async function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        hashChange = async (e) => {
            if (document.getElementById('rtDiv')) {
                document.getElementById('rtDiv').remove();
            }
            await sleep(100);
            checkRT({ extensionAPI });
        };
        window.addEventListener('hashchange', hashChange);

        checkRT(); // onload

        async function checkRT() {
            var wordCount = 0;
            const startBlock = window.location.href.split('/')[7];

            let ancestorrule = `[ 
                    [ (ancestor ?b ?a) 
                            [?a :block/children ?b] ] 
                    [ (ancestor ?b ?a) 
                            [?parent :block/children ?b ] 
                            (ancestor ?parent ?a) ] ] ]`;
            let blocks = window.roamAlphaAPI.q(`[ 
                    :find 
                        ?string
                    :in $ ?startBlock % 
                    :where 
                        [?block :block/string ?string] 
                        [?page :block/uid ?startBlock] 
                        (ancestor ?block ?page)
                    ]`, startBlock, ancestorrule);

            blocks.map((data, index) => { return data[0]; }).join('\n');

            if (document.getElementById('rtDiv')) {
                document.getElementById('rtDiv').remove();
            }

            var rtDiv = document.createElement('div');
            rtDiv.innerHTML = "";
            rtDiv.id = 'rtDiv';


            if (document.querySelector(".rm-open-left-sidebar-btn")) { // the sidebar is closed
                await sleep(20);
                if (document.querySelector("#workspaces")) { // Workspaces extension also installed, so place this to right
                    let workspaces = document.querySelector("#workspaces");
                    workspaces.after(rtDiv);
                } else if (document.querySelector("#todayTomorrow")) { // Yesterday Tomorrow extension also installed, so place this to right
                    let todayTomorrow = document.querySelector("#todayTomorrow");
                    todayTomorrow.after(rtDiv);
                } else if (document.querySelector("span.bp3-button.bp3-minimal.bp3-icon-arrow-right.pointer.bp3-small.rm-electron-nav-forward-btn")) { // electron client needs separate css
                    let electronArrows = document.getElementsByClassName("rm-electron-nav-forward-btn")[0];
                    electronArrows.after(rtDiv);
                } else {
                    let sidebarButton = document.querySelector(".rm-open-left-sidebar-btn");
                    sidebarButton.after(rtDiv);
                }
            } else { // the sidebar is open
                await sleep(20);
                if (document.querySelector("#workspaces")) { // Workspaces extension also installed, so place this to right
                    let workspaces = document.querySelector("#workspaces");
                    workspaces.after(rtDiv);
                } else if (document.querySelector("#todayTomorrow")) { // Yesterday Tomorrow extension also installed, so place this to right
                    let todayTomorrow = document.querySelector("#todayTomorrow");
                    todayTomorrow.after(rtDiv);
                } else if (document.querySelector("span.bp3-button.bp3-minimal.bp3-icon-arrow-right.pointer.bp3-small.rm-electron-nav-forward-btn")) { // electron client needs separate css
                    let electronArrows = document.getElementsByClassName("rm-electron-nav-forward-btn")[0];
                    electronArrows.after(rtDiv);
                } else {
                    var topBarContent = document.querySelector("#app > div > div > div.flex-h-box > div.roam-main > div.rm-files-dropzone > div");
                    var topBarRow = topBarContent.childNodes[1];
                    if (topBarContent && topBarRow) {
                        topBarRow.parentNode.insertBefore(rtDiv, topBarRow);
                    }
                }
            }

            for (var i = 0; i < blocks.length; i++) {
                wordCount = wordCount + blocks[i][0].split(" ").length;
            }

            if (wordCount > 0 && wpm > 0) { //fix incase of unset Roam Depot settings
                minutes = Math.floor(Math.abs(wordCount / wpm));
                seconds = Math.floor((Math.abs(wordCount / wpm) * 60) % 60);
            } else {
                minutes = 0;
                seconds = 0;
            }

            if (document.getElementById('rtSpan')) {
                var oldSpan = document.getElementById('rtSpan');
                oldSpan.remove();
            }
            var rtSpan = document.createElement('span');
            rtSpan.classList.add('bp3-button', 'bp3-minimal', 'bp3-small', 'bp3-icon-time');
            rtSpan.id = 'rtSpan';
            if (seconds < 10) {
                var txt = document.createTextNode("" + minutes + ":0" + seconds + "");
            } else {
                var txt = document.createTextNode("" + minutes + ":" + seconds + "");
            }
            rtSpan.appendChild(txt);
            var rtDiv = document.getElementById('rtDiv');
            if (rtDiv) {
                rtDiv.append(rtSpan);
            }
        }
    },
    onunload: () => {
        if (document.getElementById('rtDiv')) {
            document.getElementById('rtDiv').remove();
        }
        window.removeEventListener('hashchange', hashChange);
        observer.disconnect();
    }
}

function sendConfigAlert() {
    alert("Please set your preferred words per minute reading rate in the Roam Depot settings to a two or three digit number only");
}