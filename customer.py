import pymysql
from atm_card import ATMCard

class Customer(ATMCard):
    def __init__(self, card='', custPin='', name='', jk='', desa='', kec='', kab='', tml='', tl='', umur='', ibu='', jenis='', nik='', kk='', BalanceIDR=0):
        super().__init__(card, custPin, BalanceIDR)

        db = pymysql.connect(host='192.168.20.1',user='metropay',password='kejobon9',database='metropay',charset='utf8mb4',cursorclass=pymysql.cursors.DictCursor)
        cursor = db.cursor()
        sql = "SELECT * FROM nasabah WHERE rekening='%s'" % self.card
        cursor.execute(sql)
        results = cursor.fetchall()
        for row in results:
            self.card = row['rekening']
            self.custPin = row['pin']
            self.name = row['nama']
            self.jk = row['jk']
            self.desa = row['alamat']
            self.kec = row['kec']
            self.kab = row['kab']
            self.tml = row['tempat_lahir']
            self.tl = row['tanggal_lahir']
            self.ibu = row['nama_ibu']
            self.sekolah = row['sekolah']
            self.status = row['status']
            self.BalanceIDR = int(row['saldo_idr'])

    def checkName(self):
        return self.name
    
    def checkGender(self):
        return self.jk

    def checkAlamat(self):
        return self.desa + ' ' + self.kec + ' ' + self.kab
        
    def checkStatus(self):
        return self.status

    def checkSchool(self):
        return self.sekolah

    def checkCard(self):
        return self.card
    
    def checkPin(self):
        return self.custPin
    
    def checkIbu(self):
        return self.ibu

    def checkIDR(self):
        return self.BalanceIDR

    def Payment(self, nominal):
        self.BalanceIDR -= nominal
        db = pymysql.connect(host='192.168.20.1',user='metropay',password='kejobon9',database='metropay',charset='utf8mb4',cursorclass=pymysql.cursors.DictCursor)
        cursor = db.cursor()
        sql = "UPDATE nasabah SET saldo_idr='%d' WHERE rekening='%s'" % (self.BalanceIDR, self.card)
        cursor.execute(sql)
        db.commit()

    def witdrawIDR(self, nominal):
        self.BalanceIDR -= nominal
        db = pymysql.connect(host='192.168.20.1',user='metropay',password='kejobon9',database='metropay',charset='utf8mb4',cursorclass=pymysql.cursors.DictCursor)
        cursor = db.cursor()
        sql = "UPDATE nasabah SET saldo_idr='%d' WHERE rekening='%s'" % (self.BalanceIDR, self.card)
        cursor.execute(sql)
        db.commit()

    def depositIDR(self, nominal):
        self.BalanceIDR += nominal
        db = pymysql.connect(host='192.168.20.1',user='metropay',password='kejobon9',database='metropay',charset='utf8mb4',cursorclass=pymysql.cursors.DictCursor)
        cursor = db.cursor()
        sql = "UPDATE nasabah SET saldo_idr='%d' WHERE rekening='%s'" % (self.BalanceIDR, self.card)
        cursor.execute(sql)
        db.commit()
