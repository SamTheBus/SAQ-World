import {freezeWire} from '../contracts/wire.js';
// Reviewed V2 exterior recipe; independent of development boot and saves.
export const OPEN_TOWN_TEMPLATE_V1=freezeWire({
  "allocation": {
    "civic": 3,
    "home": 15,
    "service": 5,
    "support": 5
  },
  "arrival": [
    2,
    44
  ],
  "buildings": [
    {
      "doorPoint": [
        75,
        16
      ],
      "doorSide": "south",
      "h": 10,
      "id": "town-open:roof:001",
      "kind": "civic",
      "label": "Chapel",
      "path": [
        [
          75,
          18
        ],
        [
          75,
          19
        ],
        [
          75,
          20
        ],
        [
          75,
          21
        ],
        [
          75,
          22
        ],
        [
          75,
          23
        ],
        [
          75,
          24
        ],
        [
          75,
          25
        ],
        [
          75,
          26
        ],
        [
          75,
          27
        ],
        [
          75,
          28
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 74,
        "y": 16
      },
      "target": [
        66,
        6
      ],
      "w": 12,
      "x": 69,
      "y": 6
    },
    {
      "doorPoint": [
        14,
        18
      ],
      "doorSide": "north",
      "h": 10,
      "id": "town-open:roof:002",
      "kind": "civic",
      "label": "Civic hall",
      "path": [
        [
          14,
          15
        ],
        [
          14,
          14
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 13,
        "y": 15
      },
      "target": [
        8,
        18
      ],
      "w": 14,
      "x": 7,
      "y": 18
    },
    {
      "doorPoint": [
        82,
        66
      ],
      "doorSide": "north",
      "h": 8,
      "id": "town-open:roof:003",
      "kind": "civic",
      "label": "Guardhouse / cells",
      "path": [
        [
          82,
          63
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 81,
        "y": 63
      },
      "target": [
        76,
        66
      ],
      "w": 10,
      "x": 77,
      "y": 66
    },
    {
      "doorPoint": [
        87,
        27
      ],
      "doorSide": "south",
      "h": 8,
      "id": "town-open:roof:004",
      "kind": "service",
      "label": "Merchant / market",
      "path": [
        [
          87,
          29
        ],
        [
          86,
          29
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 86,
        "y": 27
      },
      "target": [
        51,
        18
      ],
      "w": 12,
      "x": 81,
      "y": 19
    },
    {
      "doorPoint": [
        30,
        12
      ],
      "doorSide": "south",
      "h": 8,
      "id": "town-open:roof:005",
      "kind": "service",
      "label": "Gear merchant",
      "path": [
        [
          30,
          14
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 29,
        "y": 12
      },
      "target": [
        51,
        18
      ],
      "w": 10,
      "x": 25,
      "y": 4
    },
    {
      "doorPoint": [
        46,
        59
      ],
      "doorSide": "north",
      "h": 9,
      "id": "town-open:roof:006",
      "kind": "service",
      "label": "Forge",
      "path": [
        [
          46,
          56
        ],
        [
          46,
          55
        ],
        [
          46,
          54
        ],
        [
          47,
          54
        ],
        [
          48,
          54
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 45,
        "y": 56
      },
      "target": [
        51,
        18
      ],
      "w": 11,
      "x": 41,
      "y": 59
    },
    {
      "doorPoint": [
        88,
        37
      ],
      "doorSide": "north",
      "h": 8,
      "id": "town-open:roof:007",
      "kind": "service",
      "label": "Alchemy",
      "path": [
        [
          88,
          34
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 87,
        "y": 34
      },
      "target": [
        51,
        18
      ],
      "w": 10,
      "x": 83,
      "y": 37
    },
    {
      "doorPoint": [
        52,
        20
      ],
      "doorSide": "west",
      "h": 12,
      "id": "town-open:roof:008",
      "kind": "service",
      "label": "Tavern + lodging",
      "path": [
        [
          49,
          20
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 49,
        "y": 19
      },
      "target": [
        51,
        18
      ],
      "w": 14,
      "x": 52,
      "y": 14
    },
    {
      "doorPoint": [
        33,
        46
      ],
      "doorSide": "north",
      "h": 10,
      "id": "town-open:roof:009",
      "kind": "support",
      "label": "Barn",
      "path": [
        [
          33,
          43
        ],
        [
          34,
          43
        ],
        [
          35,
          43
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 32,
        "y": 43
      },
      "target": [
        3,
        5
      ],
      "w": 14,
      "x": 26,
      "y": 46
    },
    {
      "doorPoint": [
        16,
        67
      ],
      "doorSide": "north",
      "h": 8,
      "id": "town-open:roof:010",
      "kind": "support",
      "label": "Granary",
      "path": [
        [
          16,
          64
        ],
        [
          15,
          64
        ],
        [
          15,
          63
        ],
        [
          15,
          62
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 15,
        "y": 64
      },
      "target": [
        8,
        60
      ],
      "w": 10,
      "x": 11,
      "y": 67
    },
    {
      "doorPoint": [
        54,
        7
      ],
      "doorSide": "west",
      "h": 8,
      "id": "town-open:roof:011",
      "kind": "support",
      "label": "Stable",
      "path": [
        [
          51,
          7
        ],
        [
          50,
          7
        ],
        [
          49,
          7
        ],
        [
          48,
          7
        ],
        [
          47,
          7
        ],
        [
          46,
          7
        ],
        [
          45,
          7
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 51,
        "y": 6
      },
      "target": [
        80,
        8
      ],
      "w": 12,
      "x": 54,
      "y": 3
    },
    {
      "doorPoint": [
        68,
        65
      ],
      "doorSide": "north",
      "h": 8,
      "id": "town-open:roof:012",
      "kind": "support",
      "label": "Warehouse",
      "path": [
        [
          68,
          62
        ],
        [
          68,
          61
        ],
        [
          68,
          60
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 67,
        "y": 62
      },
      "target": [
        62,
        65
      ],
      "w": 12,
      "x": 62,
      "y": 65
    },
    {
      "doorPoint": [
        33,
        31
      ],
      "doorSide": "east",
      "h": 6,
      "id": "town-open:roof:013",
      "kind": "support",
      "label": "Tool workshop",
      "path": [
        [
          35,
          31
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 33,
        "y": 30
      },
      "target": [
        25,
        64
      ],
      "w": 8,
      "x": 25,
      "y": 28
    },
    {
      "doorPoint": [
        7,
        38
      ],
      "doorSide": "south",
      "h": 5,
      "id": "town-open:roof:014",
      "kind": "home",
      "label": "Home 1",
      "path": [
        [
          7,
          40
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 6,
        "y": 38
      },
      "target": [
        8,
        50
      ],
      "w": 7,
      "x": 4,
      "y": 33
    },
    {
      "doorPoint": [
        45,
        75
      ],
      "doorSide": "south",
      "h": 5,
      "id": "town-open:roof:015",
      "kind": "home",
      "label": "Home 2",
      "path": [
        [
          45,
          77
        ],
        [
          44,
          77
        ],
        [
          43,
          77
        ],
        [
          42,
          77
        ],
        [
          41,
          77
        ],
        [
          40,
          77
        ],
        [
          39,
          77
        ],
        [
          38,
          77
        ],
        [
          37,
          77
        ],
        [
          36,
          77
        ],
        [
          35,
          77
        ],
        [
          34,
          77
        ],
        [
          33,
          77
        ],
        [
          32,
          77
        ],
        [
          31,
          77
        ],
        [
          30,
          77
        ],
        [
          29,
          77
        ],
        [
          28,
          77
        ],
        [
          27,
          77
        ],
        [
          26,
          77
        ],
        [
          25,
          77
        ],
        [
          24,
          77
        ],
        [
          23,
          77
        ],
        [
          22,
          77
        ],
        [
          22,
          76
        ],
        [
          22,
          75
        ],
        [
          22,
          74
        ],
        [
          22,
          73
        ],
        [
          22,
          72
        ],
        [
          22,
          71
        ],
        [
          22,
          70
        ],
        [
          22,
          69
        ],
        [
          22,
          68
        ],
        [
          22,
          67
        ],
        [
          22,
          66
        ],
        [
          22,
          65
        ],
        [
          21,
          65
        ],
        [
          20,
          65
        ],
        [
          19,
          65
        ],
        [
          18,
          65
        ],
        [
          17,
          65
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 44,
        "y": 75
      },
      "target": [
        32,
        60
      ],
      "w": 8,
      "x": 41,
      "y": 70
    },
    {
      "doorPoint": [
        65,
        44
      ],
      "doorSide": "south",
      "h": 5,
      "id": "town-open:roof:016",
      "kind": "home",
      "label": "Home 3",
      "path": [
        [
          65,
          46
        ],
        [
          66,
          46
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 64,
        "y": 44
      },
      "target": [
        73,
        48
      ],
      "w": 9,
      "x": 61,
      "y": 39
    },
    {
      "doorPoint": [
        86,
        16
      ],
      "doorSide": "south",
      "h": 6,
      "id": "town-open:roof:017",
      "kind": "home",
      "label": "Home 4",
      "path": [
        [
          86,
          18
        ],
        [
          85,
          18
        ],
        [
          85,
          17
        ],
        [
          84,
          17
        ],
        [
          83,
          17
        ],
        [
          82,
          17
        ],
        [
          81,
          17
        ],
        [
          80,
          17
        ],
        [
          79,
          17
        ],
        [
          78,
          17
        ],
        [
          77,
          17
        ],
        [
          76,
          17
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 85,
        "y": 16
      },
      "target": [
        79,
        10
      ],
      "w": 7,
      "x": 83,
      "y": 10
    },
    {
      "doorPoint": [
        19,
        11
      ],
      "doorSide": "south",
      "h": 6,
      "id": "town-open:roof:018",
      "kind": "home",
      "label": "Home 5",
      "path": [
        [
          19,
          13
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 18,
        "y": 11
      },
      "target": [
        24,
        6
      ],
      "w": 8,
      "x": 15,
      "y": 5
    },
    {
      "doorPoint": [
        65,
        51
      ],
      "doorSide": "east",
      "h": 6,
      "id": "town-open:roof:019",
      "kind": "home",
      "label": "Home 6",
      "path": [
        [
          67,
          51
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 65,
        "y": 50
      },
      "target": [
        65,
        63
      ],
      "w": 9,
      "x": 56,
      "y": 48
    },
    {
      "doorPoint": [
        15,
        53
      ],
      "doorSide": "east",
      "h": 7,
      "id": "town-open:roof:020",
      "kind": "home",
      "label": "Home 7",
      "path": [
        [
          17,
          53
        ],
        [
          18,
          53
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 15,
        "y": 52
      },
      "target": [
        8,
        50
      ],
      "w": 7,
      "x": 8,
      "y": 50
    },
    {
      "doorPoint": [
        31,
        63
      ],
      "doorSide": "west",
      "h": 7,
      "id": "town-open:roof:021",
      "kind": "home",
      "label": "Home 8",
      "path": [
        [
          28,
          63
        ],
        [
          28,
          64
        ],
        [
          28,
          65
        ],
        [
          27,
          65
        ],
        [
          26,
          65
        ],
        [
          25,
          65
        ],
        [
          24,
          65
        ],
        [
          23,
          65
        ],
        [
          22,
          65
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 28,
        "y": 62
      },
      "target": [
        32,
        60
      ],
      "w": 8,
      "x": 31,
      "y": 60
    },
    {
      "doorPoint": [
        82,
        51
      ],
      "doorSide": "west",
      "h": 7,
      "id": "town-open:roof:022",
      "kind": "home",
      "label": "Home 9",
      "path": [
        [
          79,
          51
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 79,
        "y": 50
      },
      "target": [
        73,
        48
      ],
      "w": 9,
      "x": 82,
      "y": 48
    },
    {
      "doorPoint": [
        90,
        5
      ],
      "doorSide": "east",
      "h": 5,
      "id": "town-open:roof:023",
      "kind": "home",
      "label": "Home 10",
      "path": [
        [
          92,
          5
        ],
        [
          91,
          5
        ],
        [
          91,
          6
        ],
        [
          91,
          7
        ],
        [
          91,
          8
        ],
        [
          91,
          9
        ],
        [
          91,
          10
        ],
        [
          91,
          11
        ],
        [
          91,
          12
        ],
        [
          91,
          13
        ],
        [
          91,
          14
        ],
        [
          91,
          15
        ],
        [
          91,
          16
        ],
        [
          91,
          17
        ],
        [
          90,
          17
        ],
        [
          89,
          17
        ],
        [
          88,
          17
        ],
        [
          87,
          17
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 90,
        "y": 4
      },
      "target": [
        79,
        10
      ],
      "w": 7,
      "x": 83,
      "y": 3
    },
    {
      "doorPoint": [
        28,
        18
      ],
      "doorSide": "north",
      "h": 5,
      "id": "town-open:roof:024",
      "kind": "home",
      "label": "Home 11",
      "path": [
        [
          28,
          15
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 27,
        "y": 15
      },
      "target": [
        24,
        6
      ],
      "w": 8,
      "x": 24,
      "y": 18
    },
    {
      "doorPoint": [
        55,
        75
      ],
      "doorSide": "south",
      "h": 5,
      "id": "town-open:roof:025",
      "kind": "home",
      "label": "Home 12",
      "path": [
        [
          55,
          77
        ],
        [
          54,
          77
        ],
        [
          53,
          77
        ],
        [
          52,
          77
        ],
        [
          51,
          77
        ],
        [
          50,
          77
        ],
        [
          49,
          77
        ],
        [
          48,
          77
        ],
        [
          47,
          77
        ],
        [
          46,
          77
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 54,
        "y": 75
      },
      "target": [
        65,
        63
      ],
      "w": 9,
      "x": 51,
      "y": 70
    },
    {
      "doorPoint": [
        28,
        61
      ],
      "doorSide": "east",
      "h": 6,
      "id": "town-open:roof:026",
      "kind": "home",
      "label": "Home 13",
      "path": [
        [
          30,
          61
        ],
        [
          30,
          62
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 28,
        "y": 60
      },
      "target": [
        8,
        50
      ],
      "w": 7,
      "x": 21,
      "y": 58
    },
    {
      "doorPoint": [
        35,
        75
      ],
      "doorSide": "south",
      "h": 6,
      "id": "town-open:roof:027",
      "kind": "home",
      "label": "Home 14",
      "path": [
        [
          35,
          77
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 34,
        "y": 75
      },
      "target": [
        32,
        60
      ],
      "w": 8,
      "x": 31,
      "y": 69
    },
    {
      "doorPoint": [
        76,
        44
      ],
      "doorSide": "south",
      "h": 6,
      "id": "town-open:roof:028",
      "kind": "home",
      "label": "Home 15",
      "path": [
        [
          76,
          46
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 75,
        "y": 44
      },
      "target": [
        73,
        48
      ],
      "w": 9,
      "x": 72,
      "y": 38
    }
  ],
  "core": [
    96,
    78
  ],
  "id": "town-open",
  "name": "Open agricultural / trading town",
  "places": [
    [
      "Market square",
      {
        "h": 16,
        "w": 19,
        "x": 35,
        "y": 28
      },
      "public"
    ],
    [
      "Community garden",
      {
        "h": 10,
        "w": 15,
        "x": 66,
        "y": 45
      },
      "garden"
    ]
  ],
  "streets": [
    [
      [
        [
          0,
          44
        ],
        [
          24,
          38
        ],
        [
          47,
          40
        ],
        [
          70,
          30
        ],
        [
          96,
          33
        ]
      ],
      5
    ],
    [
      [
        [
          47,
          40
        ],
        [
          48,
          14
        ],
        [
          38,
          0
        ]
      ],
      4
    ],
    [
      [
        [
          8,
          12
        ],
        [
          28,
          16
        ],
        [
          48,
          14
        ]
      ],
      3
    ],
    [
      [
        [
          24,
          38
        ],
        [
          18,
          60
        ],
        [
          0,
          68
        ]
      ],
      3
    ],
    [
      [
        [
          50,
          55
        ],
        [
          78,
          62
        ],
        [
          96,
          62
        ]
      ],
      3
    ],
    [
      [
        [
          47,
          40
        ],
        [
          50,
          55
        ]
      ],
      3
    ]
  ]
});
