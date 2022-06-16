convertJSON2XML
[![Build Status](https://travis-ci.org/rshyong/convertJSON2XML.svg?branch=master)](https://travis-ci.org/rshyong/convertJSON2XML)
[![Coverage Status](https://coveralls.io/repos/github/rshyong/convertJSON2XML/badge.svg?branch=master)](https://coveralls.io/github/rshyong/convertJSON2XML?branch=master)
=========

A small library that converts json to xml.

## Installation

  `npm install convertjson2xml`

## Usage

```
  const jsonToXML = require('convertjson2xml');

  let xml = jsonToXML({
    a: 1,
    b: [2,3],
    c: [],
    d: {},
    e: '',
  });

  console.log(xml);
```

Output should be

```
  <root>
    <a>1</a>
    <b>2</b>
    <b>3</b>
    <c></c>
    <d></d>
    <e/>
  </root>
```

To put attributes on a tag, use the '@' field:

```
  let xml = jsonToXML({
    a: {
      '@': {
        'attribute': 'true',
      },
      value: 1,
    },
    b: [2,3],
    c: {
      '@': {
        anotherAttribute: 'true',
      },
      '_': 'insideC',
    },
  });

  console.log(xml);
```

Output should be

```
  <root>
    <a attribute='true'>
      <value>1</value>
    </a>
    <b>2</b>
    <b>3</b>
    <c anotherAttribute='true'>insideC</c>
  </root>
```

You can also change the root field by inserting it as the second argument:

```
  let xml = jsonToXML({
    a: {
      '@': {
        'attribute': 'true',
      },
      value: 1,
    },
    b: [2,3],
    c: {
      '@': {
        anotherAttribute: 'true',
      },
      '_': 'insideC',
    },
  },'thisisthenewroot');

  console.log(xml);
```

Output should be

```
  <thisisthenewroot>
    <a attribute='true'>
      <value>1</value>
    </a>
    <b>2</b>
    <b>3</b>
    <c anotherAttribute='true'>insideC</c>
  </thisisthenewroot>
```

## Tests

  `npm test`
