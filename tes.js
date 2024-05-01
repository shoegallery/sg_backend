<Pressable
  width={"95%"}
  paddingTop={3}
  alignItems={"center"}
  onPress={() => {
    if (
      userData.wallets.phone !== 70000003 &&
      userData.wallets.phone !== 70000004
    ) {
      navigation.navigate("LoanScreenFinal");
    }
  }}

  /* onPress={() => {
        navigation.navigate("TransferScreen");
        }}
        */
>
  {({ isHovered, isPressed }) => {
    return (
      <Box
        justifyContent={"center"}
        alignItems={"center"}
        alignSelf="center"
        width={"95%"}
        bg={isPressed ? "white" : "white"}
        style={{
          transform: [
            {
              scale: isPressed ? 0.95 : 1,
            },
          ],
        }}
        p="4"
        rounded="8"
        shadow={2}
        borderWidth="0"
        borderColor="coolGray.300"
      >
        {loan.loan.map((loanItem) => (
          <View key={loanItem.index} style={styles.loanItem}>
            <Text style={styles.index}>Index: {loanItem.index}</Text>
            <Text style={styles.amountsmall}>Төлөх дүн: {loanItem.amount}</Text>
            <Text style={styles.date}>
              Төлөх огноо: {moment(loan.createdAt).format("YYYY-MM-DD")}
            </Text>
            <Text style={styles.status}>
              Status: {loanItem.status.toString()}
            </Text>
          </View>
        ))}
      </Box>
    );
  }}
</Pressable>;
