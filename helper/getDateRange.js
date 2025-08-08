const matchesFunction = {
  getDobRangeFromAge: (fromAge, toAge) => {
    const today = new Date();

    // Oldest DOB (maxAge)
    const fromDob = new Date(
      today.getFullYear() - toAge,
      today.getMonth(),
      today.getDate()
    );

    // Youngest DOB (minAge)
    const toDob = new Date(
      today.getFullYear() - fromAge,
      today.getMonth(),
      today.getDate()
    );

    return { fromDob, toDob };
  },


  getHeightRange: (height) => {
    const [feetStr, inchStr = '0'] = height.toString().split('.');
    const totalInches = parseInt(feetStr) * 12 + parseInt(inchStr);

    const toFeetInches = (inches) => {
      const f = Math.floor(inches / 12);
      const i = inches % 12;
      return `${f}.${i}`;
    };

 
    return {
      fromHeight: toFeetInches(totalInches - 2),
      toHeight: toFeetInches(totalInches + 2),
    };

  }

}




module.exports = matchesFunction;
