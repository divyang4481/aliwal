
var myFirstAssertion = 'jsAsserUnit is a nice little tool for the cute developers';
var mySecondAssertion = 'jsAsserUnit is a nice little tool for the cute developers';

Assert.isTrue(myFirstAssertion);
Assert.isFalse(true);

var TEST_THIS_ASSERTION = true;
Assert.isFalse(mySecondAssertion,
	TEST_THIS_ASSERTION,
	'mySecond_jsAsserUnit_Test:mySecondAssertion seems to be true');
Assert.isFalse(true);


