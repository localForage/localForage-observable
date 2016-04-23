define(['../bower_components/localforage/dist/localforage', '../src/localforage-observable'], function(localforage, observable) {
  var driverTestOrder = [
    localforage.WEBSQL,
    localforage.INDEXEDDB,
    localforage.LOCALSTORAGE
  ];

  localforage.setDriver(driverTestOrder).then(function() {
    console.log(localforage.driver());

    var keyValuePairs = [
      { key: 'user-1-todo-1', value: '11aa1111bbcc' },
      { key: 'user-1-todo-2', value: '22aa2222bbcc' },
      { key: 'user-1-todo-3', value: '33aa3333bbcc' },
      { key: 'user-1-todo-4', value: '44aa4444bbcc' },
      { key: 'user-2-todo-1', value: 'bb11ccaa1111' },
      { key: 'user-2-todo-2', value: 'bb22ccaa2222' },
      { key: 'user-2-todo-3', value: 'bb33ccaa3333' },
      { key: 'user-2-todo-4', value: 'bb44ccaa4444' }
    ];

    var promises = keyValuePairs.map(function(x) {
      return localforage.setItem(x.key, x.value);
    });

    return Promise.all(promises);
  }).then(function(){
    return localforage.keys();
  }).then(function(keys){
    console.log(keys);

    var itemKeys = [
      'user-1-todo-4',
      'user-1-todo-3',
      'user-2-todo-2',
      'user-2-todo-1'
    ];

    var t0 = performance.now();

    localforage.observable(itemKeys).then(function(results){
      console.log(results);
      var t1 = performance.now();
      console.log("Completed after " + (t1 - t0) + " milliseconds.");
    });
  });
});
