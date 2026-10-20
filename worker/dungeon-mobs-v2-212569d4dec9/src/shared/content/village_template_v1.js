import {freezeWire} from '../contracts/wire.js';
// Reviewed ten-building, four-chunk village; lifted unchanged from the exterior review.
export const VILLAGE_TEMPLATE_V1=freezeWire({
  "allocation": {
    "civic": 1,
    "home": 6,
    "service": 2,
    "support": 1
  },
  "arrival": [
    2,
    32
  ],
  "buildings": [
    {
      "doorPoint": [
        40,
        12
      ],
      "doorSide": "south",
      "h": 8,
      "id": "village:roof:001",
      "kind": "civic",
      "label": "Parish / meeting hall",
      "path": [
        [
          40,
          14
        ],
        [
          39,
          14
        ],
        [
          39,
          13
        ],
        [
          38,
          13
        ],
        [
          37,
          13
        ],
        [
          36,
          13
        ],
        [
          35,
          13
        ],
        [
          34,
          13
        ],
        [
          33,
          13
        ],
        [
          33,
          14
        ],
        [
          33,
          15
        ],
        [
          33,
          16
        ],
        [
          33,
          17
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 39,
        "y": 12
      },
      "target": [
        35,
        4
      ],
      "w": 10,
      "x": 35,
      "y": 4
    },
    {
      "doorPoint": [
        17,
        16
      ],
      "doorSide": "south",
      "h": 9,
      "id": "village:roof:002",
      "kind": "service",
      "label": "Merchant / optional tavern",
      "path": [
        [
          17,
          18
        ],
        [
          18,
          18
        ],
        [
          19,
          18
        ],
        [
          20,
          18
        ],
        [
          21,
          18
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 16,
        "y": 16
      },
      "target": [
        12,
        8
      ],
      "w": 11,
      "x": 12,
      "y": 7
    },
    {
      "doorPoint": [
        52,
        13
      ],
      "doorSide": "south",
      "h": 8,
      "id": "village:roof:003",
      "kind": "service",
      "label": "Forge",
      "path": [
        [
          52,
          15
        ],
        [
          52,
          16
        ],
        [
          52,
          17
        ],
        [
          52,
          18
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 51,
        "y": 13
      },
      "target": [
        42,
        5
      ],
      "w": 10,
      "x": 47,
      "y": 5
    },
    {
      "doorPoint": [
        9,
        39
      ],
      "doorSide": "north",
      "h": 8,
      "id": "village:roof:004",
      "kind": "support",
      "label": "Barn / stable",
      "path": [
        [
          9,
          36
        ],
        [
          9,
          35
        ],
        [
          9,
          34
        ],
        [
          9,
          33
        ],
        [
          9,
          32
        ],
        [
          9,
          31
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 8,
        "y": 36
      },
      "target": [
        3,
        39
      ],
      "w": 11,
      "x": 4,
      "y": 39
    },
    {
      "doorPoint": [
        6,
        9
      ],
      "doorSide": "south",
      "h": 5,
      "id": "village:roof:005",
      "kind": "home",
      "label": "Home 1",
      "path": [
        [
          6,
          11
        ],
        [
          7,
          11
        ],
        [
          8,
          11
        ],
        [
          9,
          11
        ],
        [
          10,
          11
        ],
        [
          10,
          12
        ],
        [
          10,
          13
        ],
        [
          10,
          14
        ],
        [
          10,
          15
        ],
        [
          10,
          16
        ],
        [
          10,
          17
        ],
        [
          11,
          17
        ],
        [
          12,
          17
        ],
        [
          13,
          17
        ],
        [
          14,
          17
        ],
        [
          15,
          17
        ],
        [
          16,
          17
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 5,
        "y": 9
      },
      "target": [
        4,
        4
      ],
      "w": 7,
      "x": 3,
      "y": 4
    },
    {
      "doorPoint": [
        42,
        15
      ],
      "doorSide": "north",
      "h": 5,
      "id": "village:roof:006",
      "kind": "home",
      "label": "Home 2",
      "path": [
        [
          42,
          12
        ],
        [
          41,
          12
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 41,
        "y": 12
      },
      "target": [
        53,
        3
      ],
      "w": 8,
      "x": 38,
      "y": 15
    },
    {
      "doorPoint": [
        37,
        43
      ],
      "doorSide": "east",
      "h": 5,
      "id": "village:roof:007",
      "kind": "home",
      "label": "Home 3",
      "path": [
        [
          39,
          43
        ],
        [
          39,
          42
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 37,
        "y": 42
      },
      "target": [
        19,
        39
      ],
      "w": 9,
      "x": 28,
      "y": 41
    },
    {
      "doorPoint": [
        52,
        34
      ],
      "doorSide": "south",
      "h": 6,
      "id": "village:roof:008",
      "kind": "home",
      "label": "Home 4",
      "path": [
        [
          52,
          36
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 51,
        "y": 34
      },
      "target": [
        49,
        37
      ],
      "w": 7,
      "x": 49,
      "y": 28
    },
    {
      "doorPoint": [
        29,
        9
      ],
      "doorSide": "south",
      "h": 6,
      "id": "village:roof:009",
      "kind": "home",
      "label": "Home 5",
      "path": [
        [
          29,
          11
        ],
        [
          30,
          11
        ],
        [
          31,
          11
        ],
        [
          32,
          11
        ],
        [
          33,
          11
        ],
        [
          33,
          12
        ],
        [
          33,
          13
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 28,
        "y": 9
      },
      "target": [
        26,
        3
      ],
      "w": 8,
      "x": 25,
      "y": 3
    },
    {
      "doorPoint": [
        21,
        37
      ],
      "doorSide": "north",
      "h": 6,
      "id": "village:roof:010",
      "kind": "home",
      "label": "Home 6",
      "path": [
        [
          21,
          34
        ],
        [
          21,
          33
        ],
        [
          21,
          32
        ],
        [
          21,
          31
        ],
        [
          21,
          30
        ],
        [
          21,
          29
        ]
      ],
      "porch": {
        "h": 3,
        "w": 3,
        "x": 20,
        "y": 34
      },
      "target": [
        6,
        37
      ],
      "w": 9,
      "x": 17,
      "y": 37
    }
  ],
  "core": [
    64,
    52
  ],
  "id": "village",
  "name": "Village",
  "places": [
    [
      "Village green",
      {
        "h": 11,
        "w": 13,
        "x": 21,
        "y": 17
      },
      "public"
    ],
    [
      "Shared garden",
      {
        "h": 9,
        "w": 10,
        "x": 48,
        "y": 35
      },
      "garden"
    ]
  ],
  "streets": [
    [
      [
        [
          0,
          32
        ],
        [
          18,
          28
        ],
        [
          34,
          30
        ],
        [
          52,
          20
        ],
        [
          64,
          20
        ]
      ],
      4
    ],
    [
      [
        [
          34,
          30
        ],
        [
          42,
          45
        ],
        [
          64,
          46
        ]
      ],
      3
    ]
  ]
});
