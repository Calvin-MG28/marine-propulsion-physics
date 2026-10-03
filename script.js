// ============================================================
// MARINE PROPULSION PHYSICS
// STEP 4 — SHAFT TORSION + COUPLING + SHIP CUTAWAY
// ============================================================


// ============================================================
// PHYSICAL CONSTANTS
// ============================================================

const WATER_DENSITY = 1025;        // kg/m³
const STEEL_SHEAR_MODULUS = 79e9;  // Pa


// ============================================================
// SHAFT GEOMETRY
// ============================================================

const SHAFT_DIAMETER = 0.12; // metres
const SHAFT_RADIUS = SHAFT_DIAMETER / 2;

const SHAFT_LENGTH_1 = 3.0;
const SHAFT_LENGTH_2 = 2.5;


// Polar second moment of area:
//
// J = π d⁴ / 32

const SHAFT_POLAR_J =
    Math.PI *
    Math.pow(SHAFT_DIAMETER, 4) /
    32;


// ============================================================
// SHAFT TORSIONAL STIFFNESS
//
// k = GJ / L
// ============================================================

const SHAFT_K_1 =
    STEEL_SHEAR_MODULUS *
    SHAFT_POLAR_J /
    SHAFT_LENGTH_1;


const SHAFT_K_2 =
    STEEL_SHEAR_MODULUS *
    SHAFT_POLAR_J /
    SHAFT_LENGTH_2;


// ============================================================
// ROTATIONAL INERTIAS
// ============================================================

const ENGINE_INERTIA = 80;

const SHAFT_1_INERTIA = 25;
const SHAFT_2_INERTIA = 25;

const PROPELLER_INERTIA = 250;


// ============================================================
// DRIVE
// ============================================================

const MAX_DRIVE_TORQUE = 2500;

const ENGINE_VISCOUS_DRAG = 4;


// ============================================================
// FLEXIBLE COUPLING
// ============================================================

const COUPLING_K = 90000;


// ============================================================
// DAMPING
// ============================================================

function reducedInertia(a, b) {

    return (
        a * b /
        (a + b)
    );
}


function torsionalDamping(
    stiffness,
    inertiaA,
    inertiaB,
    dampingRatio
) {

    const reduced =
        reducedInertia(
            inertiaA,
            inertiaB
        );

    return (
        2 *
        dampingRatio *
        Math.sqrt(
            stiffness *
            reduced
        )
    );
}


const COUPLING_C =
    torsionalDamping(
        COUPLING_K,
        ENGINE_INERTIA,
        SHAFT_1_INERTIA,
        0.14
    );


const SHAFT_C_1 =
    torsionalDamping(
        SHAFT_K_1,
        SHAFT_1_INERTIA,
        SHAFT_2_INERTIA,
        0.035
    );


const SHAFT_C_2 =
    torsionalDamping(
        SHAFT_K_2,
        SHAFT_2_INERTIA,
        PROPELLER_INERTIA,
        0.035
    );


// ============================================================
// FRICTION
// ============================================================

const BEARING_VISCOUS = 2.5;
const BEARING_COULOMB = 12;

const SEAL_VISCOUS = 2;
const SEAL_COULOMB = 18;

const FRICTION_SMOOTHING = 0.15;


// ============================================================
// PROPELLER
// ============================================================

const PROP_DIAMETER = 2.0;

const PROP_KT = 0.18;
const PROP_KQ = 0.035;

const PROP_AREA =
    Math.PI *
    Math.pow(
        PROP_DIAMETER / 2,
        2
    );


// ============================================================
// AXIAL THRUST BEARING
// ============================================================

const AXIAL_MASS = 1200;

const AXIAL_STIFFNESS = 2e6;
const AXIAL_DAMPING = 8000;

let axialX = 0;
let axialV = 0;


// ============================================================
// ROTATIONAL STATES
// ============================================================

const engine = {

    theta: 0,
    omega: 0,

    inertia:
        ENGINE_INERTIA
};


const shaft1 = {

    theta: 0,
    omega: 0,

    inertia:
        SHAFT_1_INERTIA
};


const shaft2 = {

    theta: 0,
    omega: 0,

    inertia:
        SHAFT_2_INERTIA
};


const propellerState = {

    theta: 0,
    omega: 0,

    inertia:
        PROPELLER_INERTIA
};


// ============================================================
// LIVE PHYSICS VALUES
// ============================================================

let driveTorque = 0;

let couplingTorque = 0;

let shaftTorque1 = 0;
let shaftTorque2 = 0;

let propellerTorque = 0;
let propellerThrust = 0;

let inducedVelocity = 0;


// ============================================================
// DISPLAY STATE
// ============================================================

let displayedShearMPa = 0;

let displayedTwistDeg = 0;

const DISPLAY_TIME_CONSTANT = 0.18;

const SHEAR_DEADBAND_MPA = 0.01;

const TWIST_DEADBAND_DEG = 0.001;


// ============================================================
// HTML
// ============================================================

const throttleInput =
    document.querySelector(
        "#throttle"
    );

const throttleValue =
    document.querySelector(
        "#throttleValue"
    );

const rpmValue =
    document.querySelector(
        "#rpmValue"
    );

const torqueValue =
    document.querySelector(
        "#torqueValue"
    );

const thrustValue =
    document.querySelector(
        "#thrustValue"
    );


// ============================================================
// SVG LAYOUT
// ============================================================

const WIDTH = 1100;
const HEIGHT = 520;

const CENTER_Y = 260;

const ENGINE_X = 150;

const COUPLING_X = 305;

const SHAFT_START_X = 350;

const BEARING_1_X = 470;

const THRUST_BEARING_X = 650;

const STERN_SEAL_X = 765;

const TRANSOM_X = 850;

const PROP_X = 915;

const RUDDER_X = 1020;


const svg =
    d3
        .select("#chart")
        .append("svg")

        .attr(
            "viewBox",
            `0 0 ${WIDTH} ${HEIGHT}`
        );


// ============================================================
// SVG DEFINITIONS
// ============================================================

const defs =
    svg.append("defs");


// ------------------------------------------------------------
// METAL GRADIENT
// ------------------------------------------------------------

const metalGradient =
    defs
        .append(
            "linearGradient"
        )

        .attr(
            "id",
            "metal"
        )

        .attr("x1", "0")
        .attr("y1", "0")

        .attr("x2", "0")
        .attr("y2", "1");


metalGradient
    .append("stop")

    .attr("offset", "0%")

    .attr(
        "stop-color",
        "#b1f5ff"
    );


metalGradient
    .append("stop")

    .attr("offset", "45%")

    .attr(
        "stop-color",
        "#16769d"
    );


metalGradient
    .append("stop")

    .attr("offset", "100%")

    .attr(
        "stop-color",
        "#092d40"
    );


// ------------------------------------------------------------
// DARK METAL
// ------------------------------------------------------------

const darkMetal =
    defs
        .append(
            "radialGradient"
        )

        .attr(
            "id",
            "darkMetal"
        );


darkMetal
    .append("stop")

    .attr("offset", "0%")

    .attr(
        "stop-color",
        "#29536a"
    );


darkMetal
    .append("stop")

    .attr("offset", "100%")

    .attr(
        "stop-color",
        "#06121a"
    );


// ============================================================
// STRESS COLOUR SCALE
// ============================================================

const stressColor =
    d3
        .scaleLinear()

        .domain([
            0,
            20,
            50
        ])

        .range([
            "#54d9ef",
            "#f0c85c",
            "#ef6155"
        ])

        .clamp(true);


// ============================================================
// DRIVETRAIN CENTERLINE
// ============================================================

svg
    .append("line")

    .attr("x1", 55)
    .attr("x2", 1050)

    .attr("y1", CENTER_Y)
    .attr("y2", CENTER_Y)

    .attr(
        "stroke",
        "#173b4d"
    )

    .attr(
        "stroke-width",
        2
    )

    .attr(
        "stroke-dasharray",
        "8 10"
    );


// ============================================================
// SHIP CUTAWAY
//
// LEFT = curved / tapered bow-side section
// RIGHT = flat transom
// Propeller sits outside transom.
// ============================================================

const shipLayer =
    svg
        .append("g")

        .attr(
            "opacity",
            0.42
        );


// ============================================================
// WATERLINE
// ============================================================

shipLayer
    .append("line")

    .attr("x1", 25)
    .attr("x2", 1070)

    .attr("y1", 318)
    .attr("y2", 318)

    .attr(
        "stroke",
        "#1f6f8d"
    )

    .attr(
        "stroke-width",
        2
    )

    .attr(
        "stroke-dasharray",
        "10 10"
    );


// ============================================================
// MAIN HULL
// ============================================================

shipLayer
    .append("path")

    .attr(
        "d",
        `

        M 45 260

        C
        58 215,
        83 180,
        125 158

        C
        160 145,
        220 140,
        300 140

        C
        420 140,
        590 142,
        720 145

        L ${TRANSOM_X} 150

        L ${TRANSOM_X} 370

        L 720 375

        C
        590 378,
        420 380,
        300 380

        C
        220 380,
        160 375,
        125 362

        C
        83 340,
        58 305,
        45 260

        Z
        `
    )

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#1f7fa5"
    )

    .attr(
        "stroke-width",
        3.2
    );


// ============================================================
// FLAT TRANSOM
// ============================================================

shipLayer
    .append("line")

    .attr(
        "x1",
        TRANSOM_X
    )

    .attr(
        "x2",
        TRANSOM_X
    )

    .attr("y1", 150)
    .attr("y2", 370)

    .attr(
        "stroke",
        "#2b88ab"
    )

    .attr(
        "stroke-width",
        4
    )

    .attr(
        "opacity",
        0.85
    );


// ============================================================
// UPPER DECK
// ============================================================

shipLayer
    .append("path")

    .attr(
        "d",
        `
        M 110 190

        Q
        150 175,
        210 170

        Q
        280 166,
        360 166

        L 820 166
        `
    )

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#1b5b74"
    )

    .attr(
        "stroke-width",
        2
    );


// ============================================================
// LOWER MACHINERY PLATFORM
// ============================================================

shipLayer
    .append("path")

    .attr(
        "d",
        `
        M 110 342

        Q
        150 355,
        220 358

        L 820 358
        `
    )

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#184d62"
    )

    .attr(
        "stroke-width",
        2
    );


// ============================================================
// FRAME RIBS
// ============================================================

const frameXs = [

    190,
    270,
    350,
    430,
    510,
    590,
    670,
    750
];


shipLayer

    .selectAll(
        ".frame-rib"
    )

    .data(
        frameXs
    )

    .join("line")

    .attr(
        "class",
        "frame-rib"
    )

    .attr(
        "x1",
        d => d
    )

    .attr(
        "x2",
        d => d
    )

    .attr(
        "y1",
        170
    )

    .attr(
        "y2",
        357
    )

    .attr(
        "stroke",
        "#133f52"
    )

    .attr(
        "stroke-width",
        1.4
    )

    .attr(
        "opacity",
        0.5
    );


// ============================================================
// BULKHEADS
// ============================================================

[
    360,
    600
]
.forEach(
    x => {

        shipLayer
            .append("line")

            .attr(
                "x1",
                x
            )

            .attr(
                "x2",
                x
            )

            .attr(
                "y1",
                165
            )

            .attr(
                "y2",
                358
            )

            .attr(
                "stroke",
                "#1c566d"
            )

            .attr(
                "stroke-width",
                2.4
            )

            .attr(
                "stroke-dasharray",
                "5 6"
            );
    }
);


// ============================================================
// STERN TUBE / SHAFT TUNNEL
// ============================================================

shipLayer
    .append("path")

    .attr(
        "d",
        `
        M 610 230

        L ${TRANSOM_X} 230

        L ${TRANSOM_X} 290

        L 610 290
        `
    )

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#245f79"
    )

    .attr(
        "stroke-width",
        2.4
    );


// ============================================================
// SHAFT EXIT THROUGH TRANSOM
// ============================================================

shipLayer
    .append("ellipse")

    .attr(
        "cx",
        TRANSOM_X
    )

    .attr(
        "cy",
        CENTER_Y
    )

    .attr("rx", 9)
    .attr("ry", 25)

    .attr(
        "fill",
        "#06131b"
    )

    .attr(
        "stroke",
        "#3b9abd"
    )

    .attr(
        "stroke-width",
        2.5
    );


// ============================================================
// UPPER STRUCTURE
// ============================================================

shipLayer
    .append("path")

    .attr(
        "d",
        `
        M 170 145

        L 205 108

        L 320 108

        L 347 145
        `
    )

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#16526a"
    )

    .attr(
        "stroke-width",
        2
    );


// ============================================================
// FOREDECK CURVE
// ============================================================

shipLayer
    .append("path")

    .attr(
        "d",
        `
        M 90 190

        Q
        115 168,
        170 145
        `
    )

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#1e6883"
    )

    .attr(
        "stroke-width",
        2
    );


// ============================================================
// RUDDER
//
// Outside hull, aft of propeller.
// ============================================================

shipLayer
    .append("path")

    .attr(
        "d",
        `
        M ${RUDDER_X} 192

        Q
        ${RUDDER_X + 25} 215,
        ${RUDDER_X + 20} 255

        L
        ${RUDDER_X + 12} 325

        Q
        ${RUDDER_X + 8} 345,
        ${RUDDER_X - 8} 350

        L
        ${RUDDER_X - 30} 340

        Q
        ${RUDDER_X - 12} 318,
        ${RUDDER_X - 10} 290

        L
        ${RUDDER_X - 4} 235

        Q
        ${RUDDER_X - 4} 210,
        ${RUDDER_X - 24} 200

        Z
        `
    )

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#23637d"
    )

    .attr(
        "stroke-width",
        2.5
    );


// ============================================================
// SHIP LABELS
// ============================================================

shipLayer
    .append("text")

    .attr("x", 110)
    .attr("y", 92)

    .attr(
        "fill",
        "#2e86a8"
    )

    .attr(
        "font-size",
        12
    )

    .attr(
        "letter-spacing",
        2
    )

    .text(
        "MACHINERY SPACE / SHAFT LINE"
    );


shipLayer
    .append("text")

    .attr(
        "x",
        TRANSOM_X - 10
    )

    .attr("y", 120)

    .attr(
        "text-anchor",
        "end"
    )

    .attr(
        "fill",
        "#2e86a8"
    )

    .attr(
        "font-size",
        12
    )

    .attr(
        "letter-spacing",
        2
    )

    .text(
        "TRANSOM"
    );


// ============================================================
// COMPONENT LABEL HELPER
// ============================================================

function componentLabel(
    text,
    x
) {

    svg
        .append("text")

        .attr(
            "x",
            x
        )

        .attr(
            "y",
            435
        )

        .attr(
            "text-anchor",
            "middle"
        )

        .attr(
            "font-size",
            12
        )

        .attr(
            "letter-spacing",
            1.5
        )

        .attr(
            "fill",
            "#658899"
        )

        .text(
            text
        );
}


// ============================================================
// DRIVE ROTOR
// ============================================================

const engineHousing =
    svg
        .append("g")

        .attr(
            "transform",
            `translate(
                ${ENGINE_X},
                ${CENTER_Y}
            )`
        );


engineHousing
    .append("circle")

    .attr("r", 72)

    .attr(
        "fill",
        "#07131b"
    )

    .attr(
        "stroke",
        "#258eb5"
    )

    .attr(
        "stroke-width",
        5
    );


// ------------------------------------------------------------
// STATOR
// ------------------------------------------------------------

d3.range(12)
    .forEach(
        i => {

            const angle =
                i *
                Math.PI *
                2 /
                12;


            engineHousing
                .append("line")

                .attr(
                    "x1",
                    Math.cos(angle) *
                    55
                )

                .attr(
                    "y1",
                    Math.sin(angle) *
                    55
                )

                .attr(
                    "x2",
                    Math.cos(angle) *
                    67
                )

                .attr(
                    "y2",
                    Math.sin(angle) *
                    67
                )

                .attr(
                    "stroke",
                    "#386f87"
                )

                .attr(
                    "stroke-width",
                    6
                )

                .attr(
                    "stroke-linecap",
                    "round"
                );
        }
    );


// ------------------------------------------------------------
// ROTOR
// ------------------------------------------------------------

const engineRotor =
    engineHousing
        .append("g");


engineRotor
    .append("circle")

    .attr("r", 39)

    .attr(
        "fill",
        "url(#darkMetal)"
    )

    .attr(
        "stroke",
        "#7de9f8"
    )

    .attr(
        "stroke-width",
        4
    );


d3.range(6)
    .forEach(
        i => {

            engineRotor
                .append("line")

                .attr("x1", 0)
                .attr("y1", 0)

                .attr("x2", 31)
                .attr("y2", 0)

                .attr(
                    "transform",
                    `rotate(${i * 60})`
                )

                .attr(
                    "stroke",
                    "#64dff0"
                )

                .attr(
                    "stroke-width",
                    5
                )

                .attr(
                    "stroke-linecap",
                    "round"
                );
        }
    );


engineRotor
    .append("circle")

    .attr("r", 9)

    .attr(
        "fill",
        "#02070a"
    )

    .attr(
        "stroke",
        "#cbfaff"
    )

    .attr(
        "stroke-width",
        3
    );


componentLabel(
    "DRIVE ROTOR",
    ENGINE_X
);


// ============================================================
// ENGINE OUTPUT SHAFT
// ============================================================

svg
    .append("line")

    .attr(
        "x1",
        ENGINE_X + 72
    )

    .attr(
        "x2",
        COUPLING_X - 45
    )

    .attr(
        "y1",
        CENTER_Y
    )

    .attr(
        "y2",
        CENTER_Y
    )

    .attr(
        "stroke",
        "#54d9ef"
    )

    .attr(
        "stroke-width",
        20
    )

    .attr(
        "stroke-linecap",
        "round"
    );


// ============================================================
// FLEXIBLE COUPLING
// ============================================================

const coupling =
    svg
        .append("g")

        .attr(
            "transform",
            `translate(
                ${COUPLING_X},
                ${CENTER_Y}
            )`
        );


coupling
    .append("circle")

    .attr("r", 54)

    .attr(
        "fill",
        "#06131b"
    )

    .attr(
        "stroke",
        "#275f78"
    )

    .attr(
        "stroke-width",
        3
    );


// ============================================================
// COUPLING INPUT FLANGE
// ============================================================

const couplingInput =
    coupling
        .append("g");


couplingInput
    .append("circle")

    .attr("r", 39)

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#7feafa"
    )

    .attr(
        "stroke-width",
        5
    );


d3.range(3)
    .forEach(
        i => {

            couplingInput
                .append("rect")

                .attr("x", 22)
                .attr("y", -7)

                .attr("width", 20)
                .attr("height", 14)

                .attr("rx", 4)

                .attr(
                    "transform",
                    `rotate(${i * 120})`
                )

                .attr(
                    "fill",
                    "#4ccce2"
                );
        }
    );


// ============================================================
// COUPLING OUTPUT FLANGE
// ============================================================

const couplingOutput =
    coupling
        .append("g");


couplingOutput
    .append("circle")

    .attr("r", 29)

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#8ef3ff"
    )

    .attr(
        "stroke-width",
        5
    );


d3.range(3)
    .forEach(
        i => {

            couplingOutput
                .append("rect")

                .attr("x", 15)
                .attr("y", -6)

                .attr("width", 18)
                .attr("height", 12)

                .attr("rx", 4)

                .attr(
                    "transform",
                    `rotate(${
                        60 +
                        i * 120
                    })`
                )

                .attr(
                    "fill",
                    "#b3f8ff"
                );
        }
    );


// ============================================================
// COUPLING ELASTOMERS
// ============================================================

const elastomerData =
    d3.range(6);


const elastomers =
    coupling

        .selectAll(
            ".elastomer"
        )

        .data(
            elastomerData
        )

        .join("path")

        .attr(
            "class",
            "elastomer"
        )

        .attr(
            "fill",
            "#f0b84f"
        )

        .attr(
            "stroke",
            "#ffe195"
        )

        .attr(
            "stroke-width",
            2
        );


componentLabel(
    "FLEXIBLE COUPLING",
    COUPLING_X
);


// ============================================================
// SHAFT BODY
// ============================================================

const shaftBody =
    svg
        .append("line")

        .attr(
            "x1",
            SHAFT_START_X
        )

        .attr(
            "x2",
            PROP_X
        )

        .attr(
            "y1",
            CENTER_Y
        )

        .attr(
            "y2",
            CENTER_Y
        )

        .attr(
            "stroke",
            "#103547"
        )

        .attr(
            "stroke-width",
            34
        )

        .attr(
            "stroke-linecap",
            "round"
        );


// ============================================================
// SHAFT HIGHLIGHT
// ============================================================

svg
    .append("line")

    .attr(
        "x1",
        SHAFT_START_X
    )

    .attr(
        "x2",
        PROP_X
    )

    .attr(
        "y1",
        CENTER_Y - 7
    )

    .attr(
        "y2",
        CENTER_Y - 7
    )

    .attr(
        "stroke",
        "#56b9d5"
    )

    .attr(
        "stroke-width",
        4
    )

    .attr(
        "opacity",
        0.55
    );


// ============================================================
// TORSION BANDS
// ============================================================

const torsionBands =
    d3
        .range(4)

        .map(
            i => {

                return svg
                    .append("path")

                    .attr(
                        "fill",
                        "none"
                    )

                    .attr(
                        "stroke",
                        i % 2 === 0
                            ? "#a4f4ff"
                            : "#238eae"
                    )

                    .attr(
                        "stroke-width",
                        2.4
                    )

                    .attr(
                        "opacity",
                        0.85
                    );
            }
        );


// ============================================================
// PHASE MARKERS
// ============================================================

const phaseMarkerPositions =
    d3.range(
        SHAFT_START_X + 15,
        PROP_X,
        45
    );


const phaseMarkers =
    svg

        .selectAll(
            ".phase-marker"
        )

        .data(
            phaseMarkerPositions
        )

        .join("line")

        .attr(
            "class",
            "phase-marker"
        )

        .attr(
            "stroke-width",
            3
        )

        .attr(
            "stroke-linecap",
            "round"
        );


// ============================================================
// BEARING
// ============================================================

function createBearing(
    x,
    labelText
) {

    const group =
        svg
            .append("g")

            .attr(
                "transform",
                `translate(
                    ${x},
                    ${CENTER_Y}
                )`
            );


    group
        .append("circle")

        .attr("r", 49)

        .attr(
            "fill",
            "#07131b"
        )

        .attr(
            "stroke",
            "#2a7999"
        )

        .attr(
            "stroke-width",
            5
        );


    group
        .append("circle")

        .attr("r", 37)

        .attr(
            "fill",
            "none"
        )

        .attr(
            "stroke",
            "#456c7c"
        )

        .attr(
            "stroke-width",
            5
        );


    d3.range(10)
        .forEach(
            i => {

                const angle =
                    i *
                    Math.PI *
                    2 /
                    10;


                group
                    .append("circle")

                    .attr(
                        "cx",
                        Math.cos(angle) *
                        30
                    )

                    .attr(
                        "cy",
                        Math.sin(angle) *
                        30
                    )

                    .attr("r", 5)

                    .attr(
                        "fill",
                        "#7fbdca"
                    );
            }
        );


    const inner =
        group.append("g");


    inner
        .append("circle")

        .attr("r", 20)

        .attr(
            "fill",
            "#071018"
        )

        .attr(
            "stroke",
            "#86effc"
        )

        .attr(
            "stroke-width",
            5
        );


    inner
        .append("line")

        .attr("x1", -14)
        .attr("x2", 14)

        .attr("y1", 0)
        .attr("y2", 0)

        .attr(
            "stroke",
            "#b5f8ff"
        )

        .attr(
            "stroke-width",
            4
        );


    componentLabel(
        labelText,
        x
    );


    return {
        group,
        inner
    };
}


const bearing1 =
    createBearing(
        BEARING_1_X,
        "SHAFT BEARING"
    );


// ============================================================
// THRUST BEARING
// ============================================================

const thrustBearing =
    svg
        .append("g")

        .attr(
            "transform",
            `translate(
                ${THRUST_BEARING_X},
                ${CENTER_Y}
            )`
        );


thrustBearing
    .append("path")

    .attr(
        "d",
        `
        M -54 -58

        Q -70 0 -54 58

        L 54 58

        Q 70 0 54 -58

        Z
        `
    )

    .attr(
        "fill",
        "#07131b"
    )

    .attr(
        "stroke",
        "#2b7d9d"
    )

    .attr(
        "stroke-width",
        4
    );


const thrustCollar =
    thrustBearing
        .append("g");


thrustCollar
    .append("ellipse")

    .attr("rx", 23)
    .attr("ry", 41)

    .attr(
        "fill",
        "#183c4c"
    )

    .attr(
        "stroke",
        "#93effa"
    )

    .attr(
        "stroke-width",
        5
    );


thrustCollar
    .append("ellipse")

    .attr("rx", 11)
    .attr("ry", 25)

    .attr(
        "fill",
        "#061017"
    )

    .attr(
        "stroke",
        "#50bdd9"
    )

    .attr(
        "stroke-width",
        4
    );


componentLabel(
    "THRUST BEARING",
    THRUST_BEARING_X
);


// ============================================================
// STERN SEAL
// ============================================================

const sternSeal =
    svg
        .append("g")

        .attr(
            "transform",
            `translate(
                ${STERN_SEAL_X},
                ${CENTER_Y}
            )`
        );


sternSeal
    .append("ellipse")

    .attr("rx", 34)
    .attr("ry", 45)

    .attr(
        "fill",
        "#07131b"
    )

    .attr(
        "stroke",
        "#317d98"
    )

    .attr(
        "stroke-width",
        5
    );


sternSeal
    .append("ellipse")

    .attr("rx", 19)
    .attr("ry", 30)

    .attr(
        "fill",
        "none"
    )

    .attr(
        "stroke",
        "#e8bd5f"
    )

    .attr(
        "stroke-width",
        5
    );


sternSeal
    .append("ellipse")

    .attr("rx", 11)
    .attr("ry", 22)

    .attr(
        "fill",
        "#061017"
    )

    .attr(
        "stroke",
        "#64dcea"
    )

    .attr(
        "stroke-width",
        4
    );


componentLabel(
    "STERN SEAL",
    STERN_SEAL_X
);


// ============================================================
// PROPELLER
// ============================================================

const propeller =
    svg
        .append("g")

        .attr(
            "transform",
            `translate(
                ${PROP_X},
                ${CENTER_Y}
            )`
        );


const propRotor =
    propeller
        .append("g");


d3.range(4)
    .forEach(
        i => {

            propRotor
                .append("path")

                .attr(
                    "d",
                    `
                    M 15 -8

                    C
                    55 -31,
                    105 -48,
                    142 -22

                    C
                    132 13,
                    77 31,
                    18 10

                    Z
                    `
                )

                .attr(
                    "transform",
                    `rotate(${i * 90})`
                )

                .attr(
                    "fill",
                    "url(#metal)"
                )

                .attr(
                    "stroke",
                    "#a7f1fa"
                )

                .attr(
                    "stroke-width",
                    3
                );
        }
    );


propRotor
    .append("circle")

    .attr("r", 28)

    .attr(
        "fill",
        "#0a2937"
    )

    .attr(
        "stroke",
        "#b4f7ff"
    )

    .attr(
        "stroke-width",
        4
    );


componentLabel(
    "PROPELLER",
    PROP_X
);


// ============================================================
// SHAFT ENGINEERING READOUTS
// ============================================================

const shaftStressText =
    svg
        .append("text")

        .attr(
            "x",
            520
        )

        .attr(
            "y",
            125
        )

        .attr(
            "text-anchor",
            "middle"
        )

        .attr(
            "font-family",
            "monospace"
        )

        .attr(
            "font-size",
            14
        )

        .attr(
            "fill",
            "#6edff1"
        );


const shaftTwistText =
    svg
        .append("text")

        .attr(
            "x",
            520
        )

        .attr(
            "y",
            147
        )

        .attr(
            "text-anchor",
            "middle"
        )

        .attr(
            "font-family",
            "monospace"
        )

        .attr(
            "font-size",
            14
        )

        .attr(
            "fill",
            "#6edff1"
        );


// ============================================================
// WAKE PARTICLES
// ============================================================

const wakeParticles =
    d3
        .range(36)

        .map(
            (_, i) => ({

                x:
                    PROP_X +
                    35 +
                    (i % 10) *
                    15,

                y:
                    CENTER_Y +
                    (
                        (
                            i * 37
                        ) %
                        150
                    ) -
                    75
            })
        );


const wake =
    svg

        .selectAll(
            ".wake"
        )

        .data(
            wakeParticles
        )

        .join("circle")

        .attr(
            "r",
            3
        )

        .attr(
            "fill",
            "#4bc5de"
        )

        .attr(
            "opacity",
            0.4
        );


// ============================================================
// PHYSICS HELPERS
// ============================================================

function smoothSign(
    omega
) {

    return Math.tanh(
        omega /
        FRICTION_SMOOTHING
    );
}


function bearingFriction(
    omega
) {

    return (
        BEARING_VISCOUS *
        omega

        +

        BEARING_COULOMB *
        smoothSign(
            omega
        )
    );
}


function sealFriction(
    omega
) {

    return (
        SEAL_VISCOUS *
        omega

        +

        SEAL_COULOMB *
        smoothSign(
            omega
        )
    );
}


function springTorque(
    a,
    b,
    stiffness,
    damping
) {

    return (
        stiffness *
        (
            a.theta -
            b.theta
        )

        +

        damping *
        (
            a.omega -
            b.omega
        )
    );
}


// ============================================================
// PROPELLER HYDRODYNAMICS
// ============================================================

function calculatePropellerLoads() {

    const n =
        propellerState.omega /
        (
            2 *
            Math.PI
        );


    const torqueMagnitude =
        PROP_KQ *
        WATER_DENSITY *
        n *
        n *
        Math.pow(
            PROP_DIAMETER,
            5
        );


    propellerTorque =
        Math.sign(
            propellerState.omega
        ) *
        torqueMagnitude;


    propellerThrust =
        PROP_KT *
        WATER_DENSITY *
        n *
        Math.abs(n) *
        Math.pow(
            PROP_DIAMETER,
            4
        );


    inducedVelocity =
        Math.sqrt(
            Math.abs(
                propellerThrust
            ) /
            (
                2 *
                WATER_DENSITY *
                PROP_AREA
            )
        );
}


// ============================================================
// PHYSICS INTEGRATOR
// ============================================================

function integratePhysics(
    frameDt
) {

    let remaining =
        frameDt;


    const maxSubstep =
        1 / 1000;


    while (
        remaining > 0
    ) {

        const dt =
            Math.min(
                maxSubstep,
                remaining
            );


        remaining -= dt;


        // ----------------------------------------------------
        // ENGINE INPUT
        // ----------------------------------------------------

        const throttle =
            Number(
                throttleInput.value
            ) /
            100;


        driveTorque =
            throttle *
            MAX_DRIVE_TORQUE;


        // ----------------------------------------------------
        // ELASTIC TORQUES
        // ----------------------------------------------------

        couplingTorque =
            springTorque(
                engine,
                shaft1,
                COUPLING_K,
                COUPLING_C
            );


        shaftTorque1 =
            springTorque(
                shaft1,
                shaft2,
                SHAFT_K_1,
                SHAFT_C_1
            );


        shaftTorque2 =
            springTorque(
                shaft2,
                propellerState,
                SHAFT_K_2,
                SHAFT_C_2
            );


        calculatePropellerLoads();


        // ----------------------------------------------------
        // ENGINE ROTATIONAL EQUATION
        // ----------------------------------------------------

        const engineAlpha =
            (
                driveTorque
                -
                couplingTorque
                -
                ENGINE_VISCOUS_DRAG *
                engine.omega
            )
            /
            engine.inertia;


        // ----------------------------------------------------
        // SHAFT NODE 1
        // ----------------------------------------------------

        const shaft1Alpha =
            (
                couplingTorque
                -
                shaftTorque1
                -
                bearingFriction(
                    shaft1.omega
                )
            )
            /
            shaft1.inertia;


        // ----------------------------------------------------
        // SHAFT NODE 2
        // ----------------------------------------------------

        const shaft2Alpha =
            (
                shaftTorque1
                -
                shaftTorque2
                -
                bearingFriction(
                    shaft2.omega
                )
            )
            /
            shaft2.inertia;


        // ----------------------------------------------------
        // PROPELLER
        // ----------------------------------------------------

        const propAlpha =
            (
                shaftTorque2
                -
                propellerTorque
                -
                sealFriction(
                    propellerState.omega
                )
            )
            /
            propellerState.inertia;


        // ----------------------------------------------------
        // VELOCITIES
        // ----------------------------------------------------

        engine.omega +=
            engineAlpha *
            dt;


        shaft1.omega +=
            shaft1Alpha *
            dt;


        shaft2.omega +=
            shaft2Alpha *
            dt;


        propellerState.omega +=
            propAlpha *
            dt;


        // ----------------------------------------------------
        // ANGLES
        // ----------------------------------------------------

        engine.theta +=
            engine.omega *
            dt;


        shaft1.theta +=
            shaft1.omega *
            dt;


        shaft2.theta +=
            shaft2.omega *
            dt;


        propellerState.theta +=
            propellerState.omega *
            dt;


        // ----------------------------------------------------
        // AXIAL THRUST BEARING
        // ----------------------------------------------------

        const axialForce =
            propellerThrust

            -

            AXIAL_STIFFNESS *
            axialX

            -

            AXIAL_DAMPING *
            axialV;


        const axialAcceleration =
            axialForce /
            AXIAL_MASS;


        axialV +=
            axialAcceleration *
            dt;


        axialX +=
            axialV *
            dt;
    }
}


// ============================================================
// INTERPOLATED SHAFT ANGLE
// ============================================================

function interpolatedShaftAngle(
    x
) {

    if (
        x <=
        THRUST_BEARING_X
    ) {

        const t =
            (
                x -
                SHAFT_START_X
            )
            /
            (
                THRUST_BEARING_X -
                SHAFT_START_X
            );


        return (
            shaft1.theta *
            (
                1 - t
            )

            +

            shaft2.theta *
            t
        );
    }


    const t =
        (
            x -
            THRUST_BEARING_X
        )
        /
        (
            PROP_X -
            THRUST_BEARING_X
        );


    return (
        shaft2.theta *
        (
            1 - t
        )

        +

        propellerState.theta *
        t
    );
}


// ============================================================
// SHAFT VISUAL
// ============================================================

function updateShaftVisual(
    dt
) {

    const samples =
        d3.range(
            SHAFT_START_X,
            PROP_X + 1,
            5
        );


    // --------------------------------------------------------
    // TORSION BANDS
    // --------------------------------------------------------

    torsionBands
        .forEach(
            (band, index) => {

                const phaseOffset =
                    index *
                    Math.PI /
                    2;


                const points =
                    samples.map(
                        x => {

                            const phase =
                                interpolatedShaftAngle(
                                    x
                                );


                            return [

                                x,

                                CENTER_Y +
                                Math.sin(
                                    phase +
                                    phaseOffset
                                ) *
                                11
                            ];
                        }
                    );


                const line =
                    d3
                        .line()

                        .curve(
                            d3.curveBasis
                        );


                band.attr(
                    "d",
                    line(
                        points
                    )
                );
            }
        );


    // --------------------------------------------------------
    // PHASE MARKERS
    // --------------------------------------------------------

    phaseMarkers

        .attr(
            "x1",
            x => {

                const angle =
                    interpolatedShaftAngle(
                        x
                    );


                return (
                    x +
                    Math.cos(angle) *
                    11
                );
            }
        )

        .attr(
            "y1",
            x => {

                const angle =
                    interpolatedShaftAngle(
                        x
                    );


                return (
                    CENTER_Y +
                    Math.sin(angle) *
                    11
                );
            }
        )

        .attr(
            "x2",
            x => {

                const angle =
                    interpolatedShaftAngle(
                        x
                    );


                return (
                    x -
                    Math.cos(angle) *
                    11
                );
            }
        )

        .attr(
            "y2",
            x => {

                const angle =
                    interpolatedShaftAngle(
                        x
                    );


                return (
                    CENTER_Y -
                    Math.sin(angle) *
                    11
                );
            }
        );


    // ========================================================
    // SHEAR STRESS
    //
    // τ = Tr / J
    // ========================================================

    const maxTorque =
        Math.max(

            Math.abs(
                shaftTorque1
            ),

            Math.abs(
                shaftTorque2
            )
        );


    const shearStressPa =
        (
            maxTorque *
            SHAFT_RADIUS
        )
        /
        SHAFT_POLAR_J;


    let shearMPa =
        shearStressPa /
        1e6;


    if (
        Math.abs(
            shearMPa
        )
        <
        SHEAR_DEADBAND_MPA
    ) {

        shearMPa = 0;
    }


    // ========================================================
    // TORSIONAL TWIST
    // ========================================================

    let totalTwistDeg =
        (
            shaft1.theta -
            propellerState.theta
        )
        *
        180 /
        Math.PI;


    if (
        Math.abs(
            totalTwistDeg
        )
        <
        TWIST_DEADBAND_DEG
    ) {

        totalTwistDeg = 0;
    }


    // ========================================================
    // DISPLAY SMOOTHING
    // ========================================================

    const displayAlpha =
        1 -
        Math.exp(
            -dt /
            DISPLAY_TIME_CONSTANT
        );


    displayedShearMPa +=
        (
            shearMPa -
            displayedShearMPa
        )
        *
        displayAlpha;


    displayedTwistDeg +=
        (
            totalTwistDeg -
            displayedTwistDeg
        )
        *
        displayAlpha;


    if (
        Math.abs(
            displayedShearMPa
        )
        <
        0.001
    ) {

        displayedShearMPa = 0;
    }


    if (
        Math.abs(
            displayedTwistDeg
        )
        <
        0.0001
    ) {

        displayedTwistDeg = 0;
    }


    // --------------------------------------------------------
    // STRESS COLOUR
    // --------------------------------------------------------

    const colour =
        stressColor(
            Math.abs(
                displayedShearMPa
            )
        );


    phaseMarkers.attr(
        "stroke",
        colour
    );


    shaftBody.attr(
        "stroke",
        d3
            .color(
                colour
            )
            .darker(2)
            .formatHex()
    );


    shaftStressText

        .attr(
            "fill",
            colour
        )

        .text(
            `SHAFT SHEAR  ${
                displayedShearMPa
                    .toFixed(2)
            } MPa`
        );


    shaftTwistText

        .attr(
            "fill",
            colour
        )

        .text(
            `TORSIONAL TWIST  ${
                displayedTwistDeg
                    .toFixed(3)
            }°`
        );
}


// ============================================================
// COUPLING VISUAL
// ============================================================

function updateCoupling() {

    const inputAngle =
        engine.theta;


    const outputAngle =
        shaft1.theta;


    couplingInput.attr(
        "transform",
        `
        rotate(
            ${
                inputAngle *
                180 /
                Math.PI
            }
        )
        `
    );


    couplingOutput.attr(
        "transform",
        `
        rotate(
            ${
                outputAngle *
                180 /
                Math.PI
            }
        )
        `
    );


    const relativeAngle =
        inputAngle -
        outputAngle;


    // Visual magnification only

    const exaggerated =
        Math.max(
            -0.45,
            Math.min(
                0.45,
                relativeAngle *
                12
            )
        );


    elastomers.attr(
        "d",
        d => {

            const baseAngle =
                d *
                Math.PI /
                3;


            const innerAngle =
                baseAngle -
                exaggerated /
                2;


            const outerAngle =
                baseAngle +
                exaggerated /
                2;


            const innerRadius = 23;
            const outerRadius = 38;

            const width = 0.10;


            const angle1 =
                innerAngle -
                width;


            const angle2 =
                innerAngle +
                width;


            const angle3 =
                outerAngle +
                width;


            const angle4 =
                outerAngle -
                width;


            const p1 = [

                Math.cos(
                    angle1
                ) *
                innerRadius,

                Math.sin(
                    angle1
                ) *
                innerRadius
            ];


            const p2 = [

                Math.cos(
                    angle2
                ) *
                innerRadius,

                Math.sin(
                    angle2
                ) *
                innerRadius
            ];


            const p3 = [

                Math.cos(
                    angle3
                ) *
                outerRadius,

                Math.sin(
                    angle3
                ) *
                outerRadius
            ];


            const p4 = [

                Math.cos(
                    angle4
                ) *
                outerRadius,

                Math.sin(
                    angle4
                ) *
                outerRadius
            ];


            return `
                M ${p1[0]} ${p1[1]}

                L ${p2[0]} ${p2[1]}

                L ${p3[0]} ${p3[1]}

                L ${p4[0]} ${p4[1]}

                Z
            `;
        }
    );


    // --------------------------------------------------------
    // COUPLING TORQUE COLOUR
    // --------------------------------------------------------

    const normalizedTorque =
        Math.min(
            1,
            Math.abs(
                couplingTorque
            )
            /
            MAX_DRIVE_TORQUE
        );


    const couplingColour =
        d3.interpolateRgb(
            "#f0b84f",
            "#ef6155"
        )(
            normalizedTorque
        );


    elastomers.attr(
        "fill",
        couplingColour
    );
}


// ============================================================
// WAKE
// ============================================================

function updateWake(
    dt
) {

    // Static actuator-disk approximation:
    //
    // far wake ≈ 2 × induced velocity

    const wakeVelocity =
        2 *
        inducedVelocity;


    const direction =
        Math.sign(
            propellerThrust
        );


    const pixelsPerMetre =
        32;


    const screenVelocity =
        wakeVelocity *
        pixelsPerMetre *
        direction;


    wakeParticles
        .forEach(
            particle => {

                particle.x +=
                    screenVelocity *
                    dt;


                if (
                    direction >= 0
                    &&
                    particle.x >
                    WIDTH + 20
                ) {

                    particle.x =
                        PROP_X + 30;
                }


                if (
                    direction < 0
                    &&
                    particle.x <
                    PROP_X - 180
                ) {

                    particle.x =
                        PROP_X - 10;
                }
            }
        );


    wake

        .attr(
            "cx",
            d => d.x
        )

        .attr(
            "cy",
            d => d.y
        )

        .attr(
            "opacity",
            Math.min(
                0.8,
                0.1 +
                inducedVelocity *
                0.12
            )
        );
}


// ============================================================
// RENDER
// ============================================================

function render(
    dt
) {

    // --------------------------------------------------------
    // ENGINE
    // --------------------------------------------------------

    engineRotor.attr(
        "transform",
        `
        rotate(
            ${
                engine.theta *
                180 /
                Math.PI
            }
        )
        `
    );


    // --------------------------------------------------------
    // COUPLING
    // --------------------------------------------------------

    updateCoupling();


    // --------------------------------------------------------
    // SHAFT
    // --------------------------------------------------------

    updateShaftVisual(
        dt
    );


    // --------------------------------------------------------
    // BEARING INNER RACE
    // --------------------------------------------------------

    const bearingAngle =
        interpolatedShaftAngle(
            BEARING_1_X
        );


    bearing1.inner.attr(
        "transform",
        `
        rotate(
            ${
                bearingAngle *
                180 /
                Math.PI
            }
        )
        `
    );


    // --------------------------------------------------------
    // THRUST COLLAR
    // --------------------------------------------------------

    const visualAxialMovement =
        axialX *
        3000;


    thrustCollar.attr(
        "transform",
        `
        translate(
            ${visualAxialMovement},
            0
        )

        rotate(
            ${
                shaft2.theta *
                180 /
                Math.PI
            }
        )
        `
    );


    // --------------------------------------------------------
    // PROPELLER
    // --------------------------------------------------------

    propRotor.attr(
        "transform",
        `
        rotate(
            ${
                propellerState.theta *
                180 /
                Math.PI
            }
        )
        `
    );


    // --------------------------------------------------------
    // WAKE
    // --------------------------------------------------------

    updateWake(
        dt
    );


    // ========================================================
    // TELEMETRY
    // ========================================================

    const throttle =
        Number(
            throttleInput.value
        );


    const propRPM =
        propellerState.omega *
        60 /
        (
            2 *
            Math.PI
        );


    throttleValue.textContent =
        `${throttle}%`;


    rpmValue.textContent =
        `${
            propRPM
                .toFixed(1)
        } RPM`;


    let displayedTorque =
        shaftTorque2;


    if (
        Math.abs(
            displayedTorque
        )
        <
        0.5
    ) {

        displayedTorque = 0;
    }


    torqueValue.textContent =
        `${
            displayedTorque
                .toFixed(0)
        } Nm`;


    let displayedThrust =
        propellerThrust /
        1000;


    if (
        Math.abs(
            displayedThrust
        )
        <
        0.005
    ) {

        displayedThrust = 0;
    }


    thrustValue.textContent =
        `${
            displayedThrust
                .toFixed(2)
        } kN`;
}


// ============================================================
// MAIN LOOP
// ============================================================

let lastTime =
    performance.now();


function animate(
    now
) {

    let dt =
        (
            now -
            lastTime
        )
        /
        1000;


    lastTime =
        now;


    // Prevent large jumps
    // when tab loses focus.

    dt =
        Math.min(
            dt,
            0.033
        );


    integratePhysics(
        dt
    );


    render(
        dt
    );


    requestAnimationFrame(
        animate
    );
}


// ============================================================
// START
// ============================================================

updateShaftVisual(
    1 / 60
);


requestAnimationFrame(
    animate
);