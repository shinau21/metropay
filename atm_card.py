class ATMCard:
    def __init__(self, card, custPin, BalanceIDR):
        self.card = card
        self.custPin = custPin
        self.BalanceIDR = BalanceIDR

    def pin(self):
        return self.custPin
    
    def balanceidr(self):
        return self.BalanceIDR