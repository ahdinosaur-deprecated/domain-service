[![ready issues](https://badge.waffle.io/open-app/domain-service.png?label=ready&title=Ready)](https://waffle.io/open-app/domain-service)
[![server tests](https://travis-ci.org/open-app/domain-service.png)](https://travis-ci.org/open-app/domain-service)
[![test coverage](https://img.shields.io/coveralls/open-app/domain-service.svg)](https://coveralls.io/r/open-app/domain-service)
[![npm version](https://badge.fury.io/js/open-app-domain-service.png)](https://npmjs.org/package/open-app-domain-service)
[![dependency status](https://david-dm.org/open-app/domain-service.png)](https://david-dm.org/open-app/domain-service)
[![devDependency status](https://david-dm.org/open-app/domain-service/dev-status.png)](https://david-dm.org/open-app/domain-service#info=devDependencies)

# domain-service

#### prototype in progress

create [feathers](http://feathersjs.com) from open-app data domain

## how to

### install

`npm i --save open-app/domain-service`

### use

```javascript
var feathers = require('feathers');
var level = require('level');
var db = level('db');

var service = require('domain-service')

var Person = require('open-app-person-domain')({
  db: db,
  name: "person",
});

var app = feathers()
  .use(require('body-parser'))
  .use(service(Person))
;
```

### test

```bash
git clone git://github.com/open-app/domain-service
cd domain-service
npm test
```

## license

[AGPLv3](LICENSE)
