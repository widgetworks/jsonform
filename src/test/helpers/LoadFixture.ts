function loadFixture(path){
    var p = path;
    if (path.charAt(0) != '/'){
        p = '/base/src/test/fixtures/' + path;
    }
    return fetch(p)
        .then(function(response){
            return response.json();
        });
}