const config = {
    tabTitle: "Reading Time",
    settings: [
        {
            id: "rt-wpm",
            name: "Words per Minute",
            description: "Reading rate in words per minute",
            action: { type: "input", placeholder: "238" },
        },
    ]
};

export default {
    onload: ({ extensionAPI }) => {
        extensionAPI.settings.panel.create(config);

        async function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        window.addEventListener('hashchange', async function newPage() {
            await sleep(10);
            checkRT();
        });

        if (!document.getElementById('rtDiv')) {
            var rtDiv = document.createElement('div');
            rtDiv.innerHTML = "";
            rtDiv.id = 'rtDiv';
        }
        var topBarContent = document.querySelector("#app > div > div > div.flex-h-box > div.roam-main > div.rm-files-dropzone > div");
        var topBarRow = topBarContent.childNodes[1];

        if (topBarContent && topBarRow) {
            topBarRow.parentNode.insertBefore(rtDiv, topBarRow);
        }

        async function checkRT() {
            var wpm, minutes, seconds;
            breakme: {
                if (extensionAPI.settings.get("rt-wpm")) {
                    const regex = /^[0-9]{2,3}$/;
                    if (extensionAPI.settings.get("rt-wpm").match(regex)) {
                        wpm = extensionAPI.settings.get("rt-wpm");
                    } else {
                        sendConfigAlert();
                        break breakme;
                    }
                } else {
                    wpm = "238"; // Brysbaert M. How many words do we read per minute? A review and meta-analysis of reading rate. 2019. doi:10.31234/osf.io/xynwg.
                }

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

                for (var i = 0; i < blocks.length; i++) {
                    wordCount = wordCount + blocks[i][0].split(" ").length;
                }

                if (wordCount > 0) {
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
        }
    },
    onunload: () => {
        if (document.getElementById('rtDiv')) {
            document.getElementById('rtDiv').remove();
        }
    }
}

function sendConfigAlert() {
    alert("Please set your preferred words per minute reading rate in the Roam Depot settings to a two or three digit number only");
}