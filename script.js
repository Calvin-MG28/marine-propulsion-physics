// ============================================================
// MARINE PLANETARY PROPULSION SYSTEM
// D3 ENGINEERING SCHEMATIC
// ============================================================


// ============================================================
// GEAR CONFIGURATION
// ============================================================

const SUN_TEETH = 16;
const PLANET_TEETH = 32;
const RING_TEETH = 80;

const SUN_RADIUS = 0.07;
const PLANET_RADIUS = 0.14;
const RING_RADIUS = 0.35;

const PLANET_DISTANCE =
    SUN_RADIUS + PLANET_RADIUS;


// ============================================================
// SCHEMATIC POSITIONS
// ============================================================

const GEAR_X = -0.54;
const GEAR_Y = 0;

const SHAFT_Y = 0;

const COUPLING_X = -0.08;
const THRUST_X = 0.13;

const BEARING_1_X = 0.34;
const BEARING_2_X = 0.53;

const STERN_TUBE_START = 0.61;
const STERN_TUBE_END = 0.78;

const PROP_X = 0.84;

const RUDDER_X = 0.96;


// ============================================================
// DATA STATE
// ============================================================

let machineData = {
    timestamp: "--",
    carrierRPM: 18,
    loadPct: 42,
    tempC: 48,
    status: "Normal"
};

let dataRows = [];
let dataIndex = 0;

const DATA_INTERVAL = 1.5;


// ============================================================
// ANIMATION
// ============================================================

let running = true;
let direction = 1;

let carrierAngle = 0;
let sunSpin = 0;
let shaftSpin = 0;
let propellerPhase = 0;

let lastTime =
    performance.now();

let dataTimer = 0;


// ============================================================
// HTML
// ============================================================

const rpmDisplay =
    document.querySelector("#rpm");

const speedInput =
    document.querySelector("#speed");

const outputRPMDisplay =
    document.querySelector("#carrierRPM");

const inputRPMDisplay =
    document.querySelector("#sunRPM");

const ringRPMDisplay =
    document.querySelector("#ringRPM");

const playButton =
    document.querySelector("#playButton");

const reverseButton =
    document.querySelector("#reverseButton");

const statusDot =
    document.querySelector(".status-dot");


// ============================================================
// SVG
// ============================================================

const svg = d3
    .select("#chart")
    .append("svg")
    .attr(
        "viewBox",
        "-1.02 -0.53 2.10 1.06"
    )
    .attr(
        "preserveAspectRatio",
        "xMidYMid meet"
    )
    .style("width", "100%")
    .style("height", "100%")
    .style("display", "block");


// ============================================================
// DEFS
// ============================================================

const defs =
    svg.append("defs");


// ============================================================
// GRADIENTS
// ============================================================

createRadialGradient(
    "sunGradient",
    [
        ["0%", "#e3fcff"],
        ["38%", "#28d7ef"],
        ["100%", "#036c9e"]
    ]
);

createRadialGradient(
    "planetGradient",
    [
        ["0%", "#b9f4ff"],
        ["52%", "#168fd0"],
        ["100%", "#074c75"]
    ]
);

createRadialGradient(
    "ringGradient",
    [
        ["0%", "#071a26"],
        ["72%", "#123d55"],
        ["100%", "#1a82b4"]
    ]
);

createLinearGradient(
    "steelGradient",
    [
        ["0%", "#0d1922"],
        ["50%", "#264757"],
        ["100%", "#0c151d"]
    ]
);

createLinearGradient(
    "shaftGradient",
    [
        ["0%", "#238bb4"],
        ["50%", "#9defff"],
        ["100%", "#238bb4"]
    ]
);

createLinearGradient(
    "propGradient",
    [
        ["0%", "#0c5d80"],
        ["50%", "#8ce8f7"],
        ["100%", "#0a6b91"]
    ]
);


// ============================================================
// GLOW
// ============================================================

const glow =
    defs
        .append("filter")
        .attr("id", "gearGlow")
        .attr("x", "-100%")
        .attr("y", "-100%")
        .attr("width", "300%")
        .attr("height", "300%");

glow
    .append("feGaussianBlur")
    .attr("stdDeviation", 0.004)
    .attr("result", "blur");

const glowMerge =
    glow.append("feMerge");

glowMerge
    .append("feMergeNode")
    .attr("in", "blur");

glowMerge
    .append("feMergeNode")
    .attr("in", "SourceGraphic");


// ============================================================
// MAIN CENTERLINE
// ============================================================

svg
    .append("line")
    .attr("x1", -0.98)
    .attr("y1", 0)
    .attr("x2", 1.02)
    .attr("y2", 0)
    .attr("stroke", "#1e536c")
    .attr("stroke-width", 0.0015)
    .attr("stroke-dasharray", "0.012 0.012")
    .attr("opacity", 0.35);


// ============================================================
// GEARBOX HOUSING
// ============================================================

const gearboxHousing =
    svg.append("g");

gearboxHousing
    .append("rect")
    .attr("x", -0.94)
    .attr("y", -0.43)
    .attr("width", 0.79)
    .attr("height", 0.86)
    .attr("rx", 0.045)
    .attr("fill", "url(#steelGradient)")
    .attr("stroke", "#247fa5")
    .attr("stroke-width", 0.004)
    .attr("opacity", 0.88);


// ------------------------------------------------------------
// Cutaway window
// ------------------------------------------------------------

gearboxHousing
    .append("circle")
    .attr("cx", GEAR_X)
    .attr("cy", GEAR_Y)
    .attr("r", 0.405)
    .attr("fill", "#06121b")
    .attr("stroke", "#2d9bc4")
    .attr("stroke-width", 0.004);


// ------------------------------------------------------------
// Flange bolts
// ------------------------------------------------------------

const housingBolts =
    d3.range(12).map(
        i =>
            i *
            2 *
            Math.PI /
            12
    );

gearboxHousing
    .selectAll(".housing-bolt")
    .data(housingBolts)
    .join("circle")
    .attr(
        "cx",
        a =>
            GEAR_X +
            Math.cos(a) *
            0.385
    )
    .attr(
        "cy",
        a =>
            GEAR_Y +
            Math.sin(a) *
            0.385
    )
    .attr("r", 0.009)
    .attr("fill", "#061019")
    .attr("stroke", "#57c9ec")
    .attr("stroke-width", 0.002);


// ------------------------------------------------------------
// Gearbox feet
// ------------------------------------------------------------

[-0.82, -0.38].forEach(x => {

    gearboxHousing
        .append("rect")
        .attr("x", x)
        .attr("y", 0.41)
        .attr("width", 0.16)
        .attr("height", 0.055)
        .attr("rx", 0.008)
        .attr("fill", "#0a151d")
        .attr("stroke", "#257fa4")
        .attr("stroke-width", 0.003);

});


// ============================================================
// LABEL HELPER
// ============================================================

function label(
    text,
    x,
    y,
    anchor = "middle"
) {

    return svg
        .append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("fill", "#6ca5bd")
        .attr("font-size", 0.025)
        .attr(
            "font-family",
            "monospace"
        )
        .attr(
            "text-anchor",
            anchor
        )
        .attr(
            "letter-spacing",
            0.004
        )
        .text(text);
}


// ============================================================
// GEARBOX LABEL
// ============================================================

label(
    "PLANETARY REDUCTION GEARBOX",
    -0.94,
    -0.465,
    "start"
);


// ============================================================
// INPUT SHAFT
// ============================================================

svg
    .append("line")
    .attr("x1", -1.00)
    .attr("y1", 0)
    .attr("x2", -0.89)
    .attr("y2", 0)
    .attr("stroke", "url(#shaftGradient)")
    .attr("stroke-width", 0.022)
    .attr("stroke-linecap", "round");


// ------------------------------------------------------------
// Input coupling
// ------------------------------------------------------------

const inputCoupling =
    svg
        .append("g")
        .attr(
            "transform",
            "translate(-0.90,0)"
        );

inputCoupling
    .append("rect")
    .attr("x", -0.025)
    .attr("y", -0.055)
    .attr("width", 0.05)
    .attr("height", 0.11)
    .attr("rx", 0.008)
    .attr("fill", "#0b1720")
    .attr("stroke", "#59d9f4")
    .attr("stroke-width", 0.003);

label(
    "INPUT",
    -0.98,
    0.095,
    "start"
);


// ============================================================
// PLANETARY GEARS
// ============================================================

const gearLayer =
    svg.append("g");


// ------------------------------------------------------------
// Ring
// ------------------------------------------------------------

const ring =
    gearLayer
        .append("path")
        .attr(
            "transform",
            `translate(${GEAR_X},${GEAR_Y})`
        )
        .attr(
            "d",
            createRingGear({
                teeth: RING_TEETH,
                pitchRadius: RING_RADIUS,
                toothDepth: 0.009,
                outerRadius: 0.375
            })
        )
        .attr(
            "fill",
            "url(#ringGradient)"
        )
        .attr(
            "stroke",
            "#38bdf8"
        )
        .attr(
            "stroke-width",
            0.003
        )
        .attr(
            "fill-rule",
            "evenodd"
        );


// ------------------------------------------------------------
// Planets
// ------------------------------------------------------------

const planetNodes =
    d3.range(3)
        .map(
            (d, i) => ({

                angle:
                    -Math.PI / 2 +
                    i *
                    2 *
                    Math.PI /
                    3,

                spin: 0,

                x: 0,
                y: 0

            })
        );


const carrierArms =
    gearLayer
        .selectAll(
            ".carrier-arm"
        )
        .data(
            planetNodes
        )
        .join("line")
        .attr(
            "stroke",
            "#3bbde8"
        )
        .attr(
            "stroke-width",
            0.008
        )
        .attr(
            "opacity",
            0.24
        );


const planetGroups =
    gearLayer
        .selectAll(
            ".planet"
        )
        .data(
            planetNodes
        )
        .join("g");


const planets =
    planetGroups
        .append("path")
        .attr(
            "d",
            createGear({
                teeth:
                    PLANET_TEETH,

                pitchRadius:
                    PLANET_RADIUS,

                toothDepth:
                    0.009,

                holeRadius:
                    0.021
            })
        )
        .attr(
            "fill",
            "url(#planetGradient)"
        )
        .attr(
            "stroke",
            "#67e8f9"
        )
        .attr(
            "stroke-width",
            0.003
        )
        .attr(
            "fill-rule",
            "evenodd"
        );


planetGroups
    .append("circle")
    .attr("r", 0.013)
    .attr("fill", "#071018")
    .attr("stroke", "#74edff")
    .attr("stroke-width", 0.003);


// ------------------------------------------------------------
// Sun
// ------------------------------------------------------------

const sunGroup =
    gearLayer
        .append("g");


const sun =
    sunGroup
        .append("path")
        .attr(
            "d",
            createGear({
                teeth:
                    SUN_TEETH,

                pitchRadius:
                    SUN_RADIUS,

                toothDepth:
                    0.009,

                holeRadius:
                    0.018
            })
        )
        .attr(
            "fill",
            "url(#sunGradient)"
        )
        .attr(
            "stroke",
            "#a5f3fc"
        )
        .attr(
            "stroke-width",
            0.003
        )
        .attr(
            "fill-rule",
            "evenodd"
        );


sunGroup
    .append("circle")
    .attr("r", 0.011)
    .attr("fill", "#e5fbff");


// ============================================================
// OUTPUT SHAFT INSIDE GEARBOX
// ============================================================

svg
    .append("line")
    .attr("x1", GEAR_X)
    .attr("y1", 0)
    .attr("x2", COUPLING_X)
    .attr("y2", 0)
    .attr("stroke", "url(#shaftGradient)")
    .attr("stroke-width", 0.020)
    .attr("stroke-linecap", "round");


// ============================================================
// FLEXIBLE COUPLING
// ============================================================

const coupling =
    svg
        .append("g")
        .attr(
            "transform",
            `translate(${COUPLING_X},0)`
        );

coupling
    .append("rect")
    .attr("x", -0.035)
    .attr("y", -0.05)
    .attr("width", 0.07)
    .attr("height", 0.10)
    .attr("rx", 0.008)
    .attr("fill", "#0c1821")
    .attr("stroke", "#49c9ed")
    .attr("stroke-width", 0.003);

coupling
    .append("line")
    .attr("x1", 0)
    .attr("y1", -0.045)
    .attr("x2", 0)
    .attr("y2", 0.045)
    .attr("stroke", "#67e8f9")
    .attr("stroke-width", 0.004);

label(
    "FLEX COUPLING",
    COUPLING_X,
    0.105
);


// ============================================================
// PROPULSION SHAFT
// ============================================================

const shaft =
    svg
        .append("line")
        .attr("x1", COUPLING_X)
        .attr("y1", 0)
        .attr("x2", PROP_X)
        .attr("y2", 0)
        .attr(
            "stroke",
            "url(#shaftGradient)"
        )
        .attr(
            "stroke-width",
            0.018
        );


// ============================================================
// SHAFT POWER FLOW DASH
// ============================================================

const powerFlow =
    svg
        .append("line")
        .attr("x1", COUPLING_X)
        .attr("y1", -0.018)
        .attr("x2", PROP_X)
        .attr("y2", -0.018)
        .attr(
            "stroke",
            "#83efff"
        )
        .attr(
            "stroke-width",
            0.002
        )
        .attr(
            "stroke-dasharray",
            "0.018 0.025"
        )
        .attr(
            "opacity",
            0.65
        );


// ============================================================
// THRUST BEARING
// ============================================================

const thrustBearing =
    createBearing(
        THRUST_X,
        0.11,
        0.15,
        "THRUST\nBEARING"
    );


// ============================================================
// SHAFT BEARINGS
// ============================================================

createBearing(
    BEARING_1_X,
    0.08,
    0.12,
    "SHAFT\nBEARING"
);

createBearing(
    BEARING_2_X,
    0.08,
    0.12,
    "SHAFT\nBEARING"
);


// ============================================================
// STERN TUBE
// ============================================================

svg
    .append("rect")
    .attr(
        "x",
        STERN_TUBE_START
    )
    .attr("y", -0.045)
    .attr(
        "width",
        STERN_TUBE_END -
        STERN_TUBE_START
    )
    .attr("height", 0.09)
    .attr("rx", 0.02)
    .attr(
        "fill",
        "#0a1821"
    )
    .attr(
        "stroke",
        "#2f9fc8"
    )
    .attr(
        "stroke-width",
        0.003
    );


// ------------------------------------------------------------
// Stern tube seals
// ------------------------------------------------------------

[
    STERN_TUBE_START,
    STERN_TUBE_END
].forEach(x => {

    svg
        .append("rect")
        .attr("x", x - 0.007)
        .attr("y", -0.055)
        .attr("width", 0.014)
        .attr("height", 0.11)
        .attr("fill", "#061018")
        .attr("stroke", "#65dfee")
        .attr("stroke-width", 0.002);

});

label(
    "STERN TUBE",
    (
        STERN_TUBE_START +
        STERN_TUBE_END
    ) / 2,
    0.105
);


// ============================================================
// SIMPLE HULL / STERN SECTION
// ============================================================

svg
    .append("path")
    .attr(
        "d",
        `
        M 0.55 -0.28
        C 0.70 -0.26,
          0.80 -0.21,
          0.88 -0.13

        L 0.88 0.13

        C 0.80 0.21,
          0.70 0.26,
          0.55 0.28
        `
    )
    .attr("fill", "none")
    .attr(
        "stroke",
        "#1b617c"
    )
    .attr(
        "stroke-width",
        0.004
    )
    .attr(
        "opacity",
        0.45
    );


// ============================================================
// PROPELLER DISK
// ============================================================

const propeller =
    svg
        .append("g")
        .attr(
            "transform",
            `translate(${PROP_X},0)`
        );


// ------------------------------------------------------------
// Propeller sweep disk
// ------------------------------------------------------------

const propDisk =
    propeller
        .append("ellipse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("rx", 0.018)
        .attr("ry", 0.145)
        .attr(
            "fill",
            "#0d7899"
        )
        .attr(
            "opacity",
            0.08
        )
        .attr(
            "stroke",
            "#60d8ef"
        )
        .attr(
            "stroke-width",
            0.002
        );


// ------------------------------------------------------------
// Propeller hub
// ------------------------------------------------------------

propeller
    .append("ellipse")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("rx", 0.045)
    .attr("ry", 0.027)
    .attr(
        "fill",
        "url(#propGradient)"
    )
    .attr(
        "stroke",
        "#9af2ff"
    )
    .attr(
        "stroke-width",
        0.003
    );


// ------------------------------------------------------------
// Propeller blades SIDE ELEVATION
// ------------------------------------------------------------

const topBlade =
    propeller
        .append("path")
        .attr(
            "fill",
            "url(#propGradient)"
        )
        .attr(
            "stroke",
            "#89ebfb"
        )
        .attr(
            "stroke-width",
            0.003
        );

const bottomBlade =
    propeller
        .append("path")
        .attr(
            "fill",
            "url(#propGradient)"
        )
        .attr(
            "stroke",
            "#89ebfb"
        )
        .attr(
            "stroke-width",
            0.003
        );


// ============================================================
// RUDDER
// ============================================================

svg
    .append("path")
    .attr(
        "d",
        `
        M ${RUDDER_X} -0.15
        L ${RUDDER_X + 0.055} -0.10
        L ${RUDDER_X + 0.045} 0.14
        L ${RUDDER_X - 0.015} 0.10
        Z
        `
    )
    .attr(
        "fill",
        "#0c1d27"
    )
    .attr(
        "stroke",
        "#287d9d"
    )
    .attr(
        "stroke-width",
        0.003
    )
    .attr(
        "opacity",
        0.72
    );

label(
    "PROPELLER",
    PROP_X,
    0.205
);

label(
    "RUDDER",
    RUDDER_X,
    0.205
);


// ============================================================
// WATER FLOW
// ============================================================

const waterFlow =
    svg
        .selectAll(
            ".flow-line"
        )
        .data([
            -0.075,
            -0.025,
            0.025,
            0.075
        ])
        .join("line")
        .attr("x1", PROP_X + 0.045)
        .attr("x2", 1.06)
        .attr("y1", d => d)
        .attr("y2", d => d)
        .attr(
            "stroke",
            "#31b7dc"
        )
        .attr(
            "stroke-width",
            0.002
        )
        .attr(
            "stroke-dasharray",
            "0.025 0.035"
        )
        .attr(
            "opacity",
            0.25
        );


// ============================================================
// CSV
// ============================================================

d3.csv(
    "gear_data.csv",
    d3.autoType
)
.then(data => {

    if (
        !data ||
        data.length === 0
    ) {
        return;
    }

    dataRows =
        data;

    updateFromData(
        dataRows[0]
    );

})
.catch(error => {

    console.error(
        "CSV ERROR:",
        error
    );

});


// ============================================================
// UPDATE DATA
// ============================================================

function updateFromData(row) {

    machineData = {

        timestamp:
            row.timestamp,

        carrierRPM:
            Number(
                row.carrierRPM
            ),

        loadPct:
            Number(
                row.loadPct
            ),

        tempC:
            Number(
                row.tempC
            ),

        status:
            row.status
    };


    if (speedInput) {

        speedInput.value =
            machineData.carrierRPM;

    }


    updateTelemetry();
    updateAppearance();
    updateStatus();
}


// ============================================================
// NEXT ROW
// ============================================================

function nextDataRow() {

    if (
        dataRows.length === 0
    ) {
        return;
    }

    dataIndex =
        (
            dataIndex + 1
        ) %
        dataRows.length;

    updateFromData(
        dataRows[
            dataIndex
        ]
    );
}


// ============================================================
// UPDATE PLANETS
// ============================================================

function updatePlanetPositions() {

    const carrierRadians =
        carrierAngle *
        Math.PI /
        180;


    planetNodes.forEach(
        planet => {

            const angle =
                planet.angle +
                carrierRadians;


            planet.x =
                GEAR_X +
                Math.cos(
                    angle
                ) *
                PLANET_DISTANCE;


            planet.y =
                GEAR_Y +
                Math.sin(
                    angle
                ) *
                PLANET_DISTANCE;

        }
    );
}


// ============================================================
// PROPELLER BLADE SHAPE
// ============================================================

function updatePropellerShape() {

    const phase =
        Math.sin(
            propellerPhase
        );


    const topLength =
        0.11 +
        Math.abs(
            phase
        ) *
        0.045;


    const thickness =
        0.025 +
        (
            1 -
            Math.abs(
                phase
            )
        ) *
        0.022;


    topBlade.attr(
        "d",
        `
        M -0.008 -0.018

        C
        ${-thickness}
        -0.045,

        ${-thickness}
        ${-topLength * 0.70},

        0
        ${-topLength}

        C
        ${thickness}
        ${-topLength * 0.72},

        ${thickness}
        -0.045,

        0.008
        -0.018

        Z
        `
    );


    bottomBlade.attr(
        "d",
        `
        M 0.008 0.018

        C
        ${thickness}
        0.045,

        ${thickness}
        ${topLength * 0.70},

        0
        ${topLength}

        C
        ${-thickness}
        ${topLength * 0.72},

        ${-thickness}
        0.045,

        -0.008
        0.018

        Z
        `
    );
}


// ============================================================
// RENDER
// ============================================================

function render(now) {

    updatePlanetPositions();

    updatePropellerShape();


    // --------------------------------------------------------
    // Planet gears
    // --------------------------------------------------------

    planetGroups
        .attr(
            "transform",
            d => `
                translate(
                    ${d.x},
                    ${d.y}
                )

                rotate(
                    ${d.spin}
                )
            `
        );


    // --------------------------------------------------------
    // Carrier arms
    // --------------------------------------------------------

    carrierArms

        .attr(
            "x1",
            GEAR_X
        )

        .attr(
            "y1",
            GEAR_Y
        )

        .attr(
            "x2",
            d => d.x
        )

        .attr(
            "y2",
            d => d.y
        );


    // --------------------------------------------------------
    // Sun
    // --------------------------------------------------------

    sunGroup.attr(
        "transform",
        `
        translate(
            ${GEAR_X},
            ${GEAR_Y}
        )

        rotate(
            ${sunSpin}
        )
        `
    );


    // --------------------------------------------------------
    // Power flow animation
    // --------------------------------------------------------

    powerFlow.attr(
        "stroke-dashoffset",
        -shaftSpin * 0.002
    );


    waterFlow.attr(
        "stroke-dashoffset",
        -shaftSpin * 0.003
    );


    // --------------------------------------------------------
    // Prop disk intensity rises with load
    // --------------------------------------------------------

    propDisk.attr(
        "opacity",
        0.06 +
        (
            machineData.loadPct /
            100
        ) *
        0.16
    );
}


// ============================================================
// TELEMETRY
// ============================================================

function updateTelemetry() {

    const outputRPM =
        machineData.carrierRPM *
        direction;


    const inputRPM =
        outputRPM *
        (
            1 +
            RING_TEETH /
            SUN_TEETH
        );


    if (rpmDisplay) {

        rpmDisplay.textContent =
            Math.abs(
                outputRPM
            ).toFixed(0);

    }


    if (outputRPMDisplay) {

        outputRPMDisplay.textContent =
            `${outputRPM.toFixed(0)} RPM`;

    }


    if (inputRPMDisplay) {

        inputRPMDisplay.textContent =
            `${inputRPM.toFixed(0)} RPM`;

    }


    if (ringRPMDisplay) {

        ringRPMDisplay.textContent =
            "LOCKED";

    }
}


// ============================================================
// DATA APPEARANCE
// ============================================================

const temperatureColor =
    d3
        .scaleLinear()
        .domain([
            30,
            60,
            90
        ])
        .range([
            "#38bdf8",
            "#fde047",
            "#ef4444"
        ])
        .clamp(true);


function updateAppearance() {

    const color =
        temperatureColor(
            machineData.tempC
        );


    sun
        .transition()
        .duration(400)
        .attr(
            "stroke",
            color
        );


    planets
        .transition()
        .duration(400)
        .attr(
            "stroke",
            color
        );


    ring
        .transition()
        .duration(400)
        .attr(
            "stroke",
            color
        );


    shaft
        .transition()
        .duration(400)
        .attr(
            "opacity",
            0.65 +
            machineData.loadPct /
            300
        );
}


// ============================================================
// STATUS
// ============================================================

function updateStatus() {

    if (!statusDot) {
        return;
    }


    let color =
        "#67e8f9";


    if (
        machineData.status ===
        "Elevated"
    ) {

        color =
            "#fde047";

    }


    if (
        machineData.status ===
        "High Load"
    ) {

        color =
            "#f97316";

    }


    statusDot.style.background =
        color;


    statusDot.style.boxShadow =
        `0 0 12px ${color}`;
}


// ============================================================
// CONTROLS
// ============================================================

playButton?.addEventListener(
    "click",
    () => {

        running =
            !running;


        playButton.textContent =
            running
                ? "PAUSE"
                : "PLAY";

    }
);


reverseButton?.addEventListener(
    "click",
    () => {

        direction *=
            -1;

        updateTelemetry();

    }
);


// ============================================================
// MAIN ANIMATION
// ============================================================

function animate(now) {

    let dt =
        (
            now -
            lastTime
        ) /
        1000;


    lastTime =
        now;


    dt =
        Math.min(
            dt,
            0.033
        );


    if (running) {

        dataTimer +=
            dt;


        if (
            dataTimer >=
            DATA_INTERVAL
        ) {

            dataTimer = 0;

            nextDataRow();

        }


        // ----------------------------------------------------
        // Output shaft RPM
        // ----------------------------------------------------

        const outputRPM =
            machineData.carrierRPM *
            direction;


        // ----------------------------------------------------
        // Input RPM
        // ----------------------------------------------------

        const inputRPM =
            outputRPM *
            (
                1 +
                RING_TEETH /
                SUN_TEETH
            );


        // ----------------------------------------------------
        // Carrier
        // ----------------------------------------------------

        carrierAngle +=
            outputRPM *
            6 *
            dt;


        // ----------------------------------------------------
        // Sun
        // ----------------------------------------------------

        sunSpin +=
            inputRPM *
            6 *
            dt;


        // ----------------------------------------------------
        // Planet spin
        // ----------------------------------------------------

        const planetRPM =
            -1.5 *
            outputRPM;


        planetNodes.forEach(
            planet => {

                planet.spin +=
                    planetRPM *
                    6 *
                    dt;

            }
        );


        // ----------------------------------------------------
        // Shaft power flow
        // ----------------------------------------------------

        shaftSpin +=
            outputRPM *
            6 *
            dt;


        // ----------------------------------------------------
        // Propeller phase
        // ----------------------------------------------------

        propellerPhase +=
            outputRPM *
            0.12 *
            dt;

    }


    render(now);


    requestAnimationFrame(
        animate
    );
}


// ============================================================
// START
// ============================================================

updateTelemetry();

render(
    performance.now()
);

requestAnimationFrame(
    animate
);


// ============================================================
// BEARING HELPER
// ============================================================

function createBearing(
    x,
    width,
    height,
    text
) {

    const group =
        svg
            .append("g")
            .attr(
                "transform",
                `translate(${x},0)`
            );


    group
        .append("rect")
        .attr(
            "x",
            -width / 2
        )
        .attr(
            "y",
            -height / 2
        )
        .attr(
            "width",
            width
        )
        .attr(
            "height",
            height
        )
        .attr(
            "rx",
            0.014
        )
        .attr(
            "fill",
            "#0b1922"
        )
        .attr(
            "stroke",
            "#2c92b8"
        )
        .attr(
            "stroke-width",
            0.003
        );


    group
        .append("circle")
        .attr("r", 0.027)
        .attr(
            "fill",
            "#061018"
        )
        .attr(
            "stroke",
            "#67e8f9"
        )
        .attr(
            "stroke-width",
            0.003
        );


    const lines =
        text.split("\n");


    lines.forEach(
        (line, i) => {

            label(
                line,
                x,
                0.105 +
                i *
                0.027
            );

        }
    );


    return group;
}


// ============================================================
// GRADIENT HELPERS
// ============================================================

function createRadialGradient(
    id,
    stops
) {

    const gradient =
        defs
            .append(
                "radialGradient"
            )
            .attr(
                "id",
                id
            );


    stops.forEach(
        ([offset, color]) => {

            gradient
                .append("stop")
                .attr(
                    "offset",
                    offset
                )
                .attr(
                    "stop-color",
                    color
                );

        }
    );

}


function createLinearGradient(
    id,
    stops
) {

    const gradient =
        defs
            .append(
                "linearGradient"
            )
            .attr(
                "id",
                id
            )
            .attr(
                "x1",
                "0%"
            )
            .attr(
                "x2",
                "100%"
            );


    stops.forEach(
        ([offset, color]) => {

            gradient
                .append("stop")
                .attr(
                    "offset",
                    offset
                )
                .attr(
                    "stop-color",
                    color
                );

        }
    );

}


// ============================================================
// EXTERNAL GEAR
// ============================================================

function createGear({
    teeth,
    pitchRadius,
    toothDepth,
    holeRadius
}) {

    const rootRadius =
        pitchRadius -
        toothDepth;


    const outerRadius =
        pitchRadius +
        toothDepth;


    const points = [];

    const stepsPerTooth =
        8;


    for (
        let tooth = 0;
        tooth < teeth;
        tooth++
    ) {

        for (
            let step = 0;
            step < stepsPerTooth;
            step++
        ) {

            const progress =
                (
                    tooth +
                    step /
                    stepsPerTooth
                ) /
                teeth;


            const angle =
                progress *
                Math.PI *
                2 -
                Math.PI / 2;


            let radius;


            if (
                step === 0 ||
                step === 1 ||
                step === 6 ||
                step === 7
            ) {

                radius =
                    rootRadius;

            }

            else if (
                step === 2 ||
                step === 5
            ) {

                radius =
                    pitchRadius;

            }

            else {

                radius =
                    outerRadius;

            }


            points.push([

                Math.cos(angle) *
                radius,

                Math.sin(angle) *
                radius

            ]);

        }
    }


    const line =
        d3
            .line()
            .curve(
                d3.curveLinearClosed
            );


    let path =
        line(points);


    path += `

        M 0 ${-holeRadius}

        A
        ${holeRadius}
        ${holeRadius}
        0 1 0
        0 ${holeRadius}

        A
        ${holeRadius}
        ${holeRadius}
        0 1 0
        0 ${-holeRadius}

        Z
    `;


    return path;
}


// ============================================================
// INTERNAL RING
// ============================================================

function createRingGear({
    teeth,
    pitchRadius,
    toothDepth,
    outerRadius
}) {

    const toothTip =
        pitchRadius -
        toothDepth;


    const toothRoot =
        pitchRadius +
        toothDepth;


    let path = `

        M 0 ${-outerRadius}

        A
        ${outerRadius}
        ${outerRadius}
        0 1 1
        0 ${outerRadius}

        A
        ${outerRadius}
        ${outerRadius}
        0 1 1
        0 ${-outerRadius}

        Z
    `;


    const points = [];

    const stepsPerTooth =
        8;


    for (
        let tooth = 0;
        tooth < teeth;
        tooth++
    ) {

        for (
            let step = 0;
            step < stepsPerTooth;
            step++
        ) {

            const progress =
                (
                    tooth +
                    step /
                    stepsPerTooth
                ) /
                teeth;


            const angle =
                progress *
                Math.PI *
                2 -
                Math.PI / 2;


            let radius;


            if (
                step === 0 ||
                step === 1 ||
                step === 6 ||
                step === 7
            ) {

                radius =
                    toothRoot;

            }

            else if (
                step === 2 ||
                step === 5
            ) {

                radius =
                    pitchRadius;

            }

            else {

                radius =
                    toothTip;

            }


            points.push([

                Math.cos(angle) *
                radius,

                Math.sin(angle) *
                radius

            ]);

        }
    }


    const line =
        d3
            .line()
            .curve(
                d3.curveLinearClosed
            );


    path +=
        line(points);


    return path;
}