"use strict";

/* =========================================================
   DIGITAL DEAD MAN'S SWITCH
   COMPLETE FRONT-END DEMO
   LocalStorage + simulated notifications
   No paid services required
   ========================================================= */

let currentSwitch =
    JSON.parse(localStorage.getItem("currentSwitch")) || null;

let switches =
    JSON.parse(localStorage.getItem("switches")) || [];

let audit =
    JSON.parse(localStorage.getItem("audit")) || [];

let notifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

let timer = null;
let stageTimer = null;


/* =========================================================
   LOGIN
   ========================================================= */

function login() {

    const email = document.getElementById("loginEmail");
    const password = document.getElementById("loginPassword");

    if (!email || !password) {
        alert("Login fields were not found.");
        return;
    }

    if (
        email.value.trim() === "" ||
        password.value.trim() === ""
    ) {
        alert("Please enter email and password.");
        return;
    }

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem(
        "userEmail",
        email.value.trim()
    );

    const loginPage =
        document.getElementById("loginPage");

    const app =
        document.getElementById("app");

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (app) {
        app.classList.remove("hidden");
    }

    addAudit("User signed in");

    updateDashboard();

    alert("Login successful!");
}


/* Make login available to HTML onclick */
window.login = login;


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    clearInterval(timer);
    clearTimeout(stageTimer);

    localStorage.removeItem("loggedIn");

    location.reload();
}

window.logout = logout;


/* =========================================================
   NAVIGATION
   ========================================================= */

function showPage(page) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(function(item) {
        item.classList.remove("active");
    });

    const selected =
        document.getElementById(page);

    if (selected) {
        selected.classList.add("active");
    }

    if (page === "dashboard") {
        updateDashboard();
    }

    if (page === "checkin") {
        updateCheckIn();
    }

    if (page === "lifecycle") {
        updateLifecycle();
    }

    if (page === "notifications") {
        updateNotifications();
    }

    if (page === "audit") {
        updateAudit();
    }

    if (page === "vault") {
        updateVault();
    }

    if (page === "trustees") {
        updateTrustees();
    }
}

window.showPage = showPage;


/* =========================================================
   MOBILE MENU
   ========================================================= */

function toggleSidebar() {

    const sidebar =
        document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

window.toggleSidebar = toggleSidebar;


/* =========================================================
   CREATE SWITCH
   ========================================================= */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        reader.readAsDataURL(file);
    });
}
async function createSwitch() {

    const name =
        getValue("switchName");

    const description =
        getValue("switchDescription");

    if (!name) {
        alert("Please enter a switch name.");
        return;
    }


    /* ---------------------------------------------
       FILE
       --------------------------------------------- */

    const fileInput =
        document.getElementById("legacyFile");

    let fileData = null;

    if (
        fileInput &&
        fileInput.files &&
        fileInput.files.length > 0
    ) {

        const file =
            fileInput.files[0];

        fileData = {
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          data: await readFileAsDataURL(file),
          uploaded:
              new Date().toISOString()
             };
    }


    /* ---------------------------------------------
       MESSAGE
       --------------------------------------------- */

    const message =
        getValue("legacyMessage");


    if (!fileData && !message) {

        alert(
            "Please choose a file or enter a legacy message."
        );

        return;
    }


    /* ---------------------------------------------
       TRUSTEES
       --------------------------------------------- */

    const primary = {

        name:
            getValue("primaryName"),

        email:
            getValue("primaryEmail")
    };


    const secondary = {

        name:
            getValue("secondaryName"),

        email:
            getValue("secondaryEmail")
    };


    if (!primary.email) {

        alert(
            "Please enter the Primary Trustee Gmail."
        );

        return;
    }


    if (!secondary.email) {

        alert(
            "Please enter the Secondary Trustee Gmail."
        );

        return;
    }


    /* ---------------------------------------------
       DURATION
       --------------------------------------------- */

    const frequencyElement =
        document.getElementById("frequency");

    const graceElement =
        document.getElementById("gracePeriod");


    const frequency =
        frequencyElement
            ? Number(frequencyElement.value)
            : 300;


    const grace =
        graceElement
            ? Number(graceElement.value)
            : 30;


    if (!frequency || frequency <= 0) {

        alert(
            "Please select a check-in duration."
        );

        return;
    }


    /* ---------------------------------------------
       FINAL ACTION
       --------------------------------------------- */

    const action =
        document.querySelector(
            'input[name="finalAction"]:checked'
        );


    const finalAction =
        action
            ? action.value
            : "release";


    /* ---------------------------------------------
       CREATE SWITCH
       --------------------------------------------- */

    const now = Date.now();


    currentSwitch = {

        id: now,

        name: name,

        description: description,

        file: fileData,

        message: message,

        primary: primary,

        secondary: secondary,

        additionalEmail:
            getValue("additionalEmail"),

        whatsapp:
            getValue("whatsapp"),

        frequency: frequency,

        gracePeriod: grace,

        stage: 1,

        active: true,

        lastCheckIn: now,

        deadline:
            now + frequency * 1000,

        finalAction: finalAction,

        released: false,

        deleted: false,

        createdAt: now
    };


    switches.push(currentSwitch);

    saveData();


    addAudit(
        "Digital switch created: " +
        name
    );


    alert(
        "DIGITAL SWITCH CREATED\n\n" +
        "Monitoring is now ACTIVE."
    );


    startTimer();

    updateDashboard();

    showPage("dashboard");
}

window.createSwitch = createSwitch;


/* =========================================================
   CHECK-IN
   ========================================================= */

function checkIn() {

    if (!currentSwitch) {

        alert(
            "No active switch exists.\n\n" +
            "Create a switch first."
        );

        return;
    }


    if (!currentSwitch.active) {

        alert(
            "This switch is no longer active."
        );

        return;
    }


    clearInterval(timer);
    clearTimeout(stageTimer);


    const now = Date.now();


    currentSwitch.stage = 1;

    currentSwitch.lastCheckIn = now;

    currentSwitch.deadline =
        now +
        currentSwitch.frequency * 1000;


    currentSwitch.active = true;

    currentSwitch.released = false;


    addAudit(
        "Check-in heartbeat received"
    );


    saveData();


    updateDashboard();

    updateCheckIn();

    updateLifecycle();


    startTimer();


    alert(
        "✓ CHECK-IN VERIFIED\n\n" +
        "The countdown has been reset."
    );
}

window.checkIn = checkIn;


/* =========================================================
   TIMER
   ========================================================= */

function startTimer() {

    clearInterval(timer);

    if (!currentSwitch) {
        return;
    }

    if (!currentSwitch.active) {
        return;
    }


    timer =
        setInterval(function() {

            if (!currentSwitch) {
                clearInterval(timer);
                return;
            }


            const remaining =
                currentSwitch.deadline -
                Date.now();


            updateCountdown(
                Math.max(0, remaining)
            );


            if (remaining <= 0) {

                clearInterval(timer);

                deadlineMissed();
            }

        }, 250);


    updateCountdown(
        Math.max(
            0,
            currentSwitch.deadline -
            Date.now()
        )
    );
}


/* =========================================================
   COUNTDOWN DISPLAY
   ========================================================= */

function updateCountdown(milliseconds) {

    const countdown =
        document.getElementById("countdown");

    if (!countdown) {
        return;
    }


    let seconds =
        Math.ceil(milliseconds / 1000);


    if (seconds < 0) {
        seconds = 0;
    }


    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;


    countdown.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0");
}


/* =========================================================
   MISSED CHECK-IN
   ========================================================= */

function deadlineMissed() {

    if (!currentSwitch) {
        return;
    }

    if (!currentSwitch.active) {
        return;
    }


    currentSwitch.stage = 2;


    addAudit(
        "Check-in deadline missed"
    );


    saveData();

    updateDashboard();

    updateLifecycle();


    /*
       Stage 2 is displayed briefly.
       Then the grace period begins.
    */

    stageTimer =
        setTimeout(
            startGracePeriod,
            1500
        );
}


/* =========================================================
   GRACE PERIOD
   ========================================================= */

function startGracePeriod() {

    if (!currentSwitch) {
        return;
    }


    if (!currentSwitch.active) {
        return;
    }


    currentSwitch.stage = 3;


    currentSwitch.deadline =
        Date.now() +
        currentSwitch.gracePeriod * 1000;


    addAudit(
        "Grace period started"
    );


    saveData();

    updateLifecycle();

    startGraceTimer();
}


/* =========================================================
   GRACE TIMER
   ========================================================= */

function startGraceTimer() {

    clearInterval(timer);


    timer =
        setInterval(function() {

            if (!currentSwitch) {
                clearInterval(timer);
                return;
            }


            const remaining =
                currentSwitch.deadline -
                Date.now();


            updateCountdown(
                Math.max(0, remaining)
            );


            if (remaining <= 0) {

                clearInterval(timer);

                notifyPrimary();
            }

        }, 250);
}


/* =========================================================
   PRIMARY TRUSTEE
   ========================================================= */

async function notifyPrimary() {

    if (!currentSwitch) {
        return;
    }

    currentSwitch.stage = 4;

    const primaryName =
        currentSwitch.primary?.name || "Primary Trustee";

    const primaryEmail =
        currentSwitch.primary?.email || "";

    if (!primaryEmail) {
        alert("Primary Trustee Gmail is missing.");
        return;
    }

    let legacyContent = "";

    if (currentSwitch.file) {

        legacyContent =
            "A legacy file has been secured for you.\n\n" +
            "File: " +
            currentSwitch.file.name +
            "\n" +
            "Type: " +
            currentSwitch.file.type;

    } else if (currentSwitch.message) {

        legacyContent =
            "Legacy Message:\n\n" +
            currentSwitch.message;

    } else {

        legacyContent =
            "Legacy content has been configured.";
    }


    try {

        const response = await fetch(
            "http://localhost:3000/send-notification",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    recipient: primaryEmail,

                    subject:
                        "Digital Legacy Alert - Primary Trustee",

                    message:
                        "Dear " +
                        primaryName +
                        ",\n\n" +

                        "The scheduled check-in was not completed.\n\n" +

                        legacyContent +
                        "\n\n" +

                        "Please review the Digital Legacy system.\n\n" +

                        "This notification was sent by the Digital Legacy demonstration system.",
         attachment:
           currentSwitch.file
        ? {
            name: currentSwitch.file.name,
            type: currentSwitch.file.type,
            data: currentSwitch.file.data
        }
        : null       })
            }
        );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message
            );
        }


        addNotification(
            "REAL GMAIL",
            primaryEmail,
            "Digital Legacy Alert - Primary Trustee"
        );


        addAudit(
            "Real Gmail sent to Primary Trustee: " +
            primaryEmail
        );


        saveData();

        updateLifecycle();

        updateNotifications();


        alert(
            "✓ REAL EMAIL SENT\n\n" +
            "Primary Trustee:\n" +
            primaryEmail +
            "\n\n" +
            "The Primary Trustee now has 1 minute to respond."
        );


        /*
         * PRIMARY RESPONSE TIMER
         * Demo: 1 minute
         */

        clearTimeout(stageTimer);

        stageTimer =
            setTimeout(
                primaryNoResponse,
                60 * 1000
            );

    }

    catch (error) {

        console.error(
            "Primary email error:",
            error
        );


        alert(
            "Could not send the Primary Trustee email.\n\n" +
            "Make sure the Python backend is running."
        );
    }
}

/* =========================================================
   TRUSTEE RESPONSE
   ========================================================= */

function primaryResponded() {

    if (!currentSwitch) {
        return;
    }


    currentSwitch.stage = 1;

    currentSwitch.active = true;

    currentSwitch.lastCheckIn =
        Date.now();

    currentSwitch.deadline =
        Date.now() +
        currentSwitch.frequency * 1000;


    addAudit(
        "Primary trustee responded"
    );


    saveData();

    updateDashboard();

    updateLifecycle();

    startTimer();


    alert(
        "PRIMARY TRUSTEE VERIFIED\n\n" +
        "Switch returned to ACTIVE."
    );
}

window.primaryResponded = primaryResponded;


/* =========================================================
   PRIMARY NO RESPONSE
   ========================================================= */

async function primaryNoResponse() {

    if (!currentSwitch) {
        return;
    }

    currentSwitch.stage = 5;

    const secondaryName =
        currentSwitch.secondary?.name ||
        "Secondary Trustee";

    const secondaryEmail =
        currentSwitch.secondary?.email ||
        "";

    if (!secondaryEmail) {
        alert("Secondary Trustee Gmail is missing.");
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/send-notification",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    recipient: secondaryEmail,

                    subject:
                        "Digital Legacy Alert - Secondary Trustee",

                    message:
                        "Dear " +
                        secondaryName +
                        ",\n\n" +

                        "The Primary Trustee did not respond within the configured response period.\n\n" +

                        "You are now the Secondary Trustee for this Digital Legacy workflow.\n\n" +

                        "Please review the Digital Legacy system.\n\n" +

                        "This notification was sent by the Digital Legacy demonstration system."
                })
            }
        );

        const result =
            await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        addNotification(
            "REAL GMAIL",
            secondaryEmail,
            "Digital Legacy Alert - Secondary Trustee"
        );

        addAudit(
            "Real Gmail sent to Secondary Trustee: " +
            secondaryEmail
        );

        saveData();

        updateLifecycle();

        updateNotifications();

        alert(
            "✓ REAL EMAIL SENT\n\n" +
            "Secondary Trustee:\n" +
            secondaryEmail +
            "\n\n" +
            "The Secondary Trustee now has 1 minute to respond."
        );

        clearTimeout(stageTimer);

        stageTimer =
            setTimeout(
                secondaryNoResponse,
                60 * 1000
            );

    } catch (error) {

        console.error(
            "Secondary email error:",
            error
        );

        alert(
            "Could not send the Secondary Trustee email.\n\n" +
            "Make sure the Python backend is running."
        );
    }
}

window.primaryNoResponse = primaryNoResponse;


/* =========================================================
   SECONDARY RESPONDED
   ========================================================= */

function secondaryNoResponse() {

    if (!currentSwitch) {
        return;
    }

    currentSwitch.stage = 6;

    addAudit(
        "Secondary trustee did not respond"
    );

    saveData();

    updateLifecycle();

    /*
     * AUTOMATIC FINAL ACTION
     * The action was selected when the switch was created.
     */

    if (currentSwitch.finalAction === "release") {

        addAudit(
            "Automatic final action: RELEASE LEGACY"
        );

        releaseLegacy();

        alert(
            "✓ AUTOMATIC FINAL ACTION\n\n" +
            "Secondary Trustee did not respond.\n\n" +
            "Configured action: RELEASE LEGACY\n\n" +
            "The legacy has been automatically released."
        );

    }

    else if (currentSwitch.finalAction === "delete") {

        currentSwitch.file = null;

        currentSwitch.message = "";

        currentSwitch.deleted = true;

        currentSwitch.active = false;

        currentSwitch.stage = 6;

        addAudit(
            "Automatic final action: DELETE LEGACY"
        );

        saveData();

        updateDashboard();

        updateLifecycle();

        updateAudit();

        updateVault();

        alert(
            "✓ AUTOMATIC FINAL ACTION\n\n" +
            "Secondary Trustee did not respond.\n\n" +
            "Configured action: DELETE LEGACY\n\n" +
            "The legacy content has been automatically deleted from the demo."
        );
    }
}

window.secondaryNoResponse = secondaryNoResponse;

window.secondaryResponded = secondaryResponded;


/* =========================================================
   SECONDARY NO RESPONSE
   ========================================================= */

function secondaryNoResponse() {

    if (!currentSwitch) {
        return;
    }


    currentSwitch.stage = 6;


    addAudit(
        "Final release stage reached"
    );


    saveData();

    updateLifecycle();


    alert(
        "FINAL STAGE REACHED\n\n" +
        "Choose RELEASE or DELETE."
    );
}

window.secondaryNoResponse = secondaryNoResponse;


/* =========================================================
   LIFECYCLE
   ========================================================= */

function updateLifecycle() {

    if (!currentSwitch) {
        return;
    }


    for (
        let i = 1;
        i <= 6;
        i++
    ) {

        const stage =
            document.getElementById(
                "stage" + i
            );


        if (!stage) {
            continue;
        }


        stage.classList.remove(
            "active"
        );


        if (
            currentSwitch.stage === i
        ) {

            stage.classList.add(
                "active"
            );
        }
    }


    const controls =
        document.getElementById(
            "stageControls"
        );


    if (!controls) {
        return;
    }


    if (currentSwitch.stage === 4) {

        controls.classList.remove(
            "hidden"
        );


        controls.innerHTML = `

            <h3>
                Primary Trustee Response
            </h3>

            <p>
                Simulate the trustee response.
            </p>

            <br>

            <button
                class="primary-btn"
                onclick="primaryResponded()">

                RESPONDED

            </button>

            <button
                class="danger-btn"
                onclick="primaryNoResponse()">

                NO RESPONSE

            </button>
        `;

        return;
    }


    if (currentSwitch.stage === 5) {

        controls.classList.remove(
            "hidden"
        );


        controls.innerHTML = `

            <h3>
                Secondary Trustee Response
            </h3>

            <p>
                Simulate the trustee response.
            </p>

            <br>

            <button
                class="primary-btn"
                onclick="secondaryResponded()">

                RESPONDED

            </button>

            <button
                class="danger-btn"
                onclick="secondaryNoResponse()">

                NO RESPONSE

            </button>
        `;

        return;
    }


    if (currentSwitch.stage === 6) {

        controls.classList.remove(
            "hidden"
        );


        controls.innerHTML = `

            <h3>
                Final Action
            </h3>

            <p>
                Select what happens to the
                digital legacy.
            </p>

            <br>

            <button
                class="primary-btn"
                onclick="releaseLegacy()">

                RELEASE LEGACY

            </button>

            <button
                class="danger-btn"
                onclick="deleteLegacy()">

                DELETE LEGACY

            </button>
        `;

        return;
    }


    controls.classList.add(
        "hidden"
    );

    controls.innerHTML = "";
}

window.updateLifecycle = updateLifecycle;


/* =========================================================
   RELEASE LEGACY
   ========================================================= */

function releaseLegacy() {

    if (!currentSwitch) {
        return;
    }


    const recipients = [];


    if (
        currentSwitch.primary &&
        currentSwitch.primary.email
    ) {

        recipients.push(
            currentSwitch.primary.email
        );
    }


    if (
        currentSwitch.secondary &&
        currentSwitch.secondary.email
    ) {

        recipients.push(
            currentSwitch.secondary.email
        );
    }


    if (
        currentSwitch.additionalEmail
    ) {

        recipients.push(
            currentSwitch.additionalEmail
        );
    }


    if (
        currentSwitch.whatsapp
    ) {

        recipients.push(
            currentSwitch.whatsapp
        );
    }


    currentSwitch.active = false;

    currentSwitch.released = true;

    currentSwitch.stage = 6;


    addAudit(
        "Legacy release simulation completed"
    );


    recipients.forEach(
        function(recipient) {

            const type =
                recipient.includes("@")
                    ? "SIMULATED GMAIL"
                    : "SIMULATED WHATSAPP";


            addNotification(
                type,
                recipient,
                "Digital Legacy Released"
            );
        }
    );


    saveData();


    updateDashboard();

    updateLifecycle();

    updateNotifications();

    updateAudit();


    alert(
        "✓ RELEASE SIMULATION COMPLETED\n\n" +
        "Recipients: " +
        recipients.length +
        "\n\n" +
        "No real Gmail or WhatsApp message was sent."
    );
}

window.releaseLegacy = releaseLegacy;


/* =========================================================
   DELETE LEGACY
   ========================================================= */

function deleteLegacy() {

    if (!currentSwitch) {
        return;
    }


    const confirmation =
        prompt(
            "Type DELETE to permanently delete the demo legacy:"
        );


    if (confirmation !== "DELETE") {

        alert(
            "Deletion cancelled."
        );

        return;
    }


    currentSwitch.file = null;

    currentSwitch.message = "";

    currentSwitch.deleted = true;

    currentSwitch.active = false;

    currentSwitch.stage = 6;


    addAudit(
        "Legacy data deleted in demo mode"
    );


    saveData();


    updateDashboard();

    updateLifecycle();

    updateAudit();


    alert(
        "✓ DEMO LEGACY DELETED\n\n" +
        "No external files were permanently deleted."
    );
}

window.deleteLegacy = deleteLegacy;


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function addNotification(
    type,
    recipient,
    subject
) {

    notifications.unshift({

        id: Date.now(),

        type: type,

        recipient: recipient,

        subject: subject,

        status:
            "REAL EMAIL SENT",

        timestamp:
            new Date().toISOString()
    });

    saveData();
}

window.primaryNoResponse = primaryNoResponse;


function updateNotifications() {

    const list =
        document.getElementById(
            "notificationList"
        );


    if (!list) {
        return;
    }


    if (notifications.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No notifications yet.
            </div>
        `;

        return;
    }


    list.innerHTML =
        notifications
            .map(function(item) {

                return `

                    <div class="notification">

                        <strong>
                            ${escapeHTML(item.type)}
                        </strong>

                        <h3>
                            ${escapeHTML(item.subject)}
                        </h3>

                        <p>
                            To:
                            ${escapeHTML(item.recipient)}
                        </p>

                        <span class="status-pill">
                          ${escapeHTML(item.status || "REAL EMAIL SENT")}
                          </span> 

                        <small>
                            ${new Date(
                                item.timestamp
                            ).toLocaleString()}
                        </small>

                    </div>

                `;

            })
            .join("");
}

window.updateNotifications = updateNotifications;


/* =========================================================
   AUDIT
   ========================================================= */

function addAudit(message) {

    audit.unshift({

        message: message,

        timestamp:
            new Date().toISOString()
    });


    saveData();
}


function updateAudit() {

    const list =
        document.getElementById(
            "auditList"
        );


    if (!list) {
        return;
    }


    if (audit.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No activity yet.
            </div>
        `;

        return;
    }


    list.innerHTML =
        audit
            .map(function(item) {

                return `

                    <div class="audit-item">

                        <strong>
                            ${new Date(
                                item.timestamp
                            ).toLocaleTimeString()}
                        </strong>

                        <span>
                            ${escapeHTML(
                                item.message
                            )}
                        </span>

                    </div>

                `;

            })
            .join("");
}

window.updateAudit = updateAudit;


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    const activeCount =
        switches.filter(
            function(item) {
                return item.active;
            }
        ).length;


    const inactiveCount =
        switches.length -
        activeCount;


    setText(
        "activeCount",
        activeCount
    );


    setText(
        "inactiveCount",
        inactiveCount
    );


    if (currentSwitch) {

        setText(
            "dashboardLastCheck",
            new Date(
                currentSwitch.lastCheckIn
            ).toLocaleString()
        );


        setText(
            "dashboardStage",
            "STAGE " +
            currentSwitch.stage
        );
    }


    const list =
        document.getElementById(
            "switchList"
        );


    if (!list) {
        return;
    }


    if (switches.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No switches created yet.
            </div>
        `;

        return;
    }


    list.innerHTML =
        switches
            .map(function(item) {

                return `

                    <div class="switch-item">

                        <div>

                            <h3>
                                ${escapeHTML(
                                    item.name
                                )}
                            </h3>

                            <p>
                                Stage ${item.stage}
                            </p>

                            <p>
                                ${
                                    item.file
                                        ? escapeHTML(
                                            item.file.name
                                          )
                                        : "Legacy message"
                                }
                            </p>

                        </div>

                        <span>
                            ${
                                item.active
                                    ? "ACTIVE"
                                    : "INACTIVE"
                            }
                        </span>

                    </div>

                `;

            })
            .join("");
}

window.updateDashboard = updateDashboard;


/* =========================================================
   CHECK-IN PAGE
   ========================================================= */

function updateCheckIn() {

    if (!currentSwitch) {
        return;
    }


    setText(
        "terminalSwitch",
        currentSwitch.name
    );


    setText(
        "lastVerified",
        new Date(
            currentSwitch.lastCheckIn
        ).toLocaleString()
    );


    updateCountdown(
        Math.max(
            0,
            currentSwitch.deadline -
            Date.now()
        )
    );
}

window.updateCheckIn = updateCheckIn;


/* =========================================================
   TRUSTEES
   ========================================================= */

function updateTrustees() {

    if (!currentSwitch) {
        return;
    }


    const primary =
        currentSwitch.primary || {};


    const secondary =
        currentSwitch.secondary || {};


    setText(
        "primaryDisplay",
        primary.name +
        " — " +
        primary.email
    );


    setText(
        "secondaryDisplay",
        secondary.name +
        " — " +
        secondary.email
    );
}

window.updateTrustees = updateTrustees;


/* =========================================================
   VAULT
   ========================================================= */

function updateVault() {

    const list =
        document.getElementById(
            "vaultList"
        );


    if (!list) {
        return;
    }


    if (!currentSwitch) {

        list.innerHTML = `
            <div class="empty-state">
                No legacy content.
            </div>
        `;

        return;
    }


    if (currentSwitch.file) {

        list.innerHTML = `

            <div class="vault-file">

                <strong>
                    ${escapeHTML(
                        currentSwitch.file.name
                    )}
                </strong>

                <p>
                    Type:
                    ${escapeHTML(
                        currentSwitch.file.type
                    )}
                </p>

                <p>
                    Size:
                    ${formatBytes(
                        currentSwitch.file.size
                    )}
                </p>

                <span>
                    SECURED
                </span>

            </div>
        `;

        return;
    }


    if (currentSwitch.message) {

        list.innerHTML = `

            <div class="vault-file">

                <strong>
                    Legacy Message
                </strong>

                <p>
                    ${escapeHTML(
                        currentSwitch.message
                    )}
                </p>

                <span>
                    SECURED
                </span>

            </div>
        `;

        return;
    }


    list.innerHTML = `
        <div class="empty-state">
            Legacy content has been released or deleted.
        </div>
    `;
}

window.updateVault = updateVault;


/* =========================================================
   FILE PREVIEW
   ========================================================= */

function previewSelectedFile() {

    const input =
        document.getElementById(
            "legacyFile"
        );


    const preview =
        document.getElementById(
            "filePreview"
        );


    if (
        !input ||
        !input.files ||
        !input.files.length ||
        !preview
    ) {
        return;
    }


    const file =
        input.files[0];


    preview.classList.remove(
        "hidden"
    );


    preview.innerHTML = `

        <strong>
            ${escapeHTML(file.name)}
        </strong>

        <br>

        <small>
            ${escapeHTML(
                file.type || "Unknown"
            )}
            ·
            ${formatBytes(file.size)}
        </small>
    `;
}


/* =========================================================
   SAVE DATA
   ========================================================= */

function saveData() {

    localStorage.setItem(
        "currentSwitch",
        JSON.stringify(currentSwitch)
    );


    localStorage.setItem(
        "switches",
        JSON.stringify(switches)
    );


    localStorage.setItem(
        "audit",
        JSON.stringify(audit)
    );


    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );
}


/* =========================================================
   RESET DEMO
   ========================================================= */

function resetDemo() {

    const ok =
        confirm(
            "Reset the complete Digital Dead Man's Switch demo?"
        );


    if (!ok) {
        return;
    }


    clearInterval(timer);

    clearTimeout(stageTimer);

    localStorage.clear();

    location.reload();
}

window.resetDemo = resetDemo;


/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value.trim();
}


function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent = value;
    }
}


function formatBytes(bytes) {

    if (!bytes) {
        return "0 Bytes";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        (
            bytes /
            Math.pow(1024, index)
        ).toFixed(2)
        +
        " " +
        units[index]
    );
}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   FILE INPUT
   ========================================================= */

document.addEventListener(
    "change",
    function(event) {

        if (
            event.target &&
            event.target.id === "legacyFile"
        ) {

            previewSelectedFile();
        }
    }
);


/* =========================================================
   APPLICATION START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const loggedIn =
            localStorage.getItem(
                "loggedIn"
            );


        const loginPage =
            document.getElementById(
                "loginPage"
            );


        const app =
            document.getElementById(
                "app"
            );


        if (loggedIn === "true") {

            if (loginPage) {
                loginPage.classList.add(
                    "hidden"
                );
            }


            if (app) {
                app.classList.remove(
                    "hidden"
                );
            }


            updateDashboard();

            updateCheckIn();

            updateLifecycle();

            updateNotifications();

            updateAudit();

            updateVault();

            updateTrustees();


            if (
                currentSwitch &&
                currentSwitch.active
            ) {

                startTimer();
            }

        } else {

            if (loginPage) {
                loginPage.classList.remove(
                    "hidden"
                );
            }


            if (app) {
                app.classList.add(
                    "hidden"
                );
            }
        }
    }
);