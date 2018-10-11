var $tests = $('.tests');

var count = 0;
_tests.forEach(function(groupList, groupIndex){
    const tests = groupList[0];
    const title = groupList[1];
    
    let $groupEl = $(`
<div class="group-wrapper group-wrapper--${groupIndex}">
    <h1>${groupIndex}: ${title}</h1>
</div>    
`);
    $tests.append($groupEl);
    
    tests.forEach(function(test, index){
        let curJsonform = test.jsonform;
        
        if (!curJsonform.form) {
          curJsonform.form = ['*'];
        }
        curJsonform.form.push({
          type: 'actions',
          items: [
            {
              type: 'submit',
              value: 'Submit'
            }
          ]
        });
        curJsonform.onSubmit = function (errors, values) {
          console.log(errors, values);
        };
        
        let testWrapper = $(`<div class="test-wrapper test-wrapper--${groupIndex}-${index}"></div>`);
        $groupEl.append(testWrapper);
        $(`<h2>[${count}] Test ${index}: "<span class="test-name">${test.name}</span>"</h2>`).appendTo(testWrapper);
        $(`<form id="testform-${groupIndex}-${index}" class="form-vertical"></form>`)
            .appendTo(testWrapper)
            .jsonForm(curJsonform);
        
        count++;
    });
    
});

