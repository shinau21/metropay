import datetime
import locale
import os
import os.path
import getpass as pwd
from os import path, read
from time import sleep
from random import randint
from os import system,name
from customer import Customer
import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522

def checklogin(r,p):
    akun = Customer(r,p)
    if (r == akun.checkCard() and p == akun.checkPin()):
        return True
    else:
        return False

def banner():
    print("================================================")
    print("                    METROPAY                    ")
    print("================================================")
    print("                E-Payment System                ")
    print("")

def clear():
    if name == 'nt':
        _ = system('cls')
    else:
        _ = system('clear')
    
locale.setlocale(locale.LC_ALL, '')
GPIO.setwarnings(False)
status = False
while True:
    method = ['Tarik Saldo', 'Isi Saldo', 'Pembayaran']
    count = 0
    sc = SimpleMFRC522()
    while (status == False and count == 0):
        clear()
        banner()
        print("Scan Kartu Anda")
        card = str(sc.read_id())
        pin = pwd.getpass("Masukan PIN : ")
        
        cl = checklogin(card,pin)
        if (cl != False):
            status = True
        else:
            count += 1

    while (status == False and count > 0 ):
        clear()
        banner()
        print("PIN yang anda masukan salah, silahkan coba lagi")
        pin = pwd.getpass("Masukan Kembali PIN Anda : ")
        cl = checklogin(card,pin)
        if (cl != False):
            status = True
        else:
            count += 1

        if (count == 3):
            print("Error, Silahkan coba lagi")
            exit()

    while (status == True):
        atm = Customer(card)
        clear()
        banner()
        print("Nama : " + atm.checkName())
        print("")
        print("1. Cek Saldo")
        print("2. Tarik Saldo")
        print("3. Isi Saldo")
        print("4. Pembayaran")
        print("5. Info Pengguna")
        print("0. Logout")
        print("")
        pil = input("Masukan Inputan (0-5) :")
        if pil == '1':
            clear()
            banner()
            saldo_idr = atm.checkIDR()
            print("Saldo IDR : Rp.", '{0:n}'.format(saldo_idr))
            sleep(2)

        elif pil == '2':
            clear()
            banner()
            print("1. Tarik Saldo IDR")

            print("")
            inp_tar = input("Masukan Inputan Anda : ")
            if inp_tar == '1':
                clear()
                banner()
                lmt_tidr = 50000
                print("Minimal Penarikan Saldo IDR = Rp.", '{0:n}'.format(lmt_tidr))
                inp_nom = int(input("Masukan Nominal IDR Yang Akan Ditarik : "))
                s_idr = atm.checkIDR() - inp_nom
                if (inp_nom >= lmt_tidr):
                    if (atm.checkIDR() >= inp_nom and s_idr >= lmt_tidr):
                        atm.witdrawIDR(inp_nom)
                        print("Saldo IDR Yang Anda Tarik : Rp.", str(inp_nom))
                        print("Sisa Saldo IDR Anda : Rp.", '{0:n}'.format(atm.checkIDR()))
                        sleep(2)
                        rec = randint(100000,1000000)
                        date = str(datetime.datetime.now())
                        if(path.exists("nasabah/" + str(atm.checkCard()) + ".txt")):
                            file = open("nasabah/" + str(atm.checkCard()) + ".txt", "a")
                            file.write("\n")
                            file.write("Record    : " + str(rec) + "\n")
                            file.write("Waktu     : " + date + "\n")
                            file.write("Rekening  : " + str(atm.checkCard()) + "\n")
                            file.write("Method : " + method[0] + "\n")
                            file.write("Tarik : Rp." + '{0:n}'.format(inp_nom) + "\n")
                            file.write("Saldo : Rp." + '{0:n}'.format(saldo_idr) + "\n")
                            file.close()
                        else:
                            file = open("nasabah/" + str(atm.checkCard()) + ".txt", "w+")
                            file.write("===================================================\n")
                            file.write("                  Riwayat Transaksi                \n")
                            file.write("===================================================\n")
                            file.write("No Rek    : " + str(atm.checkCard()) + "\n")
                            file.write("Nama      : " + str(atm.checkName()) + "\n")
                            file.write("Status   : " + str(atm.checkStatus()) + "\n")
                            file.write("Sekolah   : " + str(atm.checkSchool()) + "\n")
                            file.write("Alamat   : " + str(atm.checkAlamat()) + "\n")
                            file.write("\n")
                            file.write("\n")
                            file.write("Record    : " + str(rec) + "\n")
                            file.write("Waktu     : " + date + "\n")
                            file.write("Rekening  : " + str(atm.checkCard()) + "\n")
                            file.write("Method : " + method[0] + "\n")
                            file.write("Tarik : Rp." + '{0:n}'.format(inp_nom) + "\n")
                            file.write("Saldo : Rp." + '{0:n}'.format(saldo_idr) + "\n")
                            file.close()

                    elif (s_idr < lmt_tidr):
                        print("Saldo Tersisa Harus Lebih Dari Rp." + str(lmt_tidr-1))
                        sleep(2)
                    else:
                        print("Saldo IDR Tidak Cukup Untuk Melakukan Penarikan")
                        sleep(2)
                else:
                    lmt = 49999
                    print("Nominal Yang Anda Masukan Terlalu Sedikit")
                    print("Silahkan Coba Lagi")
                    print("Pastikan Nominal Yang Anda Masukan Harus Lebih Dari Rp.", '{0:n}'.format(lmt))
                    sleep(2)            

        elif pil == '3':
            clear()
            banner()
            print("1. Isi Saldo")
            print("")
            inp_sim = input("Masukan Inputan Anda : ")
            if inp_sim == '1':
                clear()
                banner()
                print("Masukan nominal yang akan disimpan : ")
                inp_nom = int(input("Rp. "))
                atm.depositIDR(inp_nom)
                print("Berhasil menyimpan saldo " + "Rp." + '{0:n}'.format(inp_nom))
                print("Saldo Anda : Rp.", '{0:n}'.format(atm.checkIDR()))
                sleep(2)
                rec = randint(100000,1000000)
                date = str(datetime.datetime.now())
                if(path.exists("nasabah/" + str(atm.checkCard()) + ".txt")):
                    file = open("nasabah/" + str(atm.checkCard()) + ".txt", "a")
                    file.write("\n")
                    file.write("Record    : " + str(rec) + "\n")
                    file.write("Waktu     : " + date + "\n")
                    file.write("Rekening  : " + str(atm.checkCard()) + "\n")
                    file.write("Method : " + method[1] + "\n")
                    file.write("Isi : Rp." + '{0:n}'.format(inp_nom) + "\n")
                    file.write("Saldo : Rp." + '{0:n}'.format(saldo_idr) + "\n")
                    file.close()
                else:
                    file = open("nasabah/" + str(atm.checkCard()) + ".txt", "w+")
                    file.write("===================================================\n")
                    file.write("                  Riwayat Transaksi                \n")
                    file.write("===================================================\n")
                    file.write("No Rek    : " + str(atm.checkCard()) + "\n")
                    file.write("Nama      : " + str(atm.checkName()) + "\n")
                    file.write("Status   : " + str(atm.checkStatus()) + "\n")
                    file.write("Sekolah   : " + str(atm.checkSchool()) + "\n")
                    file.write("Alamat   : " + str(atm.checkAlamat()) + "\n")
                    file.write("\n")
                    file.write("\n")
                    file.write("Record    : " + str(rec) + "\n")
                    file.write("Waktu     : " + date + "\n")
                    file.write("Rekening  : " + str(atm.checkCard()) + "\n")
                    file.write("Method : " + method[1] + "\n")
                    file.write("Isi : Rp." + '{0:n}'.format(inp_nom) + "\n")
                    file.write("Saldo : Rp." + '{0:n}'.format(saldo_idr) + "\n")
                    file.close()

        elif pil == '4':
            clear()
            banner()
            print("")
            print("Masukan nominal yang akan dibayar")
            inp_nom = int(input("Rp. "))
            print("")
            paystatus = False
            while (paystatus != True):
                print("Scan Kartu Anda")
                card = sc.read_id()
                pin = pwd.getpass("Masukan PIN : ")            
                cl = checklogin(card,pin)
                if (cl != False):
                    status = True
                else:
                    count += 1
                s_idr = atm.checkIDR() - inp_nom
                if (atm.checkIDR() >= inp_nom):
                    atm.Payment(inp_nom)
                    print("Saldo IDR Yang Dibayar : Rp.", '{0:n}'.format(inp_nom))
                    print("Sisa Saldo Anda : Rp.", '{0:n}'.format(atm.checkIDR()))
                    sleep(2)
                    rec = randint(100000,1000000)
                    if(path.exists("nasabah/" + str(atm.checkCard()) + ".txt")):
                        file = open("nasabah/" + str(atm.checkCard()) + ".txt", "a")
                        file.write("\n")
                        file.write("Record    : " + str(rec) + "\n")
                        file.write("Waktu     : " + date + "\n")
                        file.write("Rekening  : " + str(atm.checkCard()) + "\n")
                        file.write("Method : " + method[2] + "\n")
                        file.write("Bayar : Rp." + '{0:n}'.format(inp_nom) + "\n")
                        file.write("Saldo : Rp." + '{0:n}'.format(saldo_idr) + "\n")
                        file.close()
                    else:
                        file = open("nasabah/" + str(atm.checkCard()) + ".txt", "w+")
                        file.write("===================================================\n")
                        file.write("                  Riwayat Transaksi                \n")
                        file.write("===================================================\n")
                        file.write("No Rek    : " + str(atm.checkCard()) + "\n")
                        file.write("Nama      : " + str(atm.checkName()) + "\n")
                        file.write("Status   : " + str(atm.checkStatus()) + "\n")
                        file.write("Sekolah   : " + str(atm.checkSchool()) + "\n")
                        file.write("Alamat   : " + str(atm.checkAlamat()) + "\n")
                        file.write("\n")
                        file.write("\n")
                        file.write("Record    : " + str(rec) + "\n")
                        file.write("Waktu     : " + date + "\n")
                        file.write("Rekening  : " + str(atm.checkCard()) + "\n")
                        file.write("Method : " + method[2] + "\n")
                        file.write("Bayar : Rp." + '{0:n}'.format(inp_nom) + "\n")
                        file.write("Saldo : Rp." + '{0:n}'.format(saldo_idr) + "\n")
                        file.close()
                    paystatus = True
                else:
                    print("Saldo anda tidak cukup untuk melakukan pembayaran")
                    sleep(2)
                    paystatus = True

        elif pil == '5':
            clear()
            banner()
            print("===============================")
            print("       Informasi Nasabah       ")
            print("================================")
            print("Nama     : " + atm.checkName())
            print("Status   : " + atm.checkStatus())
            print("Sekolah   : " + atm.checkSchool())
            print("Alamat   : " + atm.checkAlamat())
            sleep(2)

        elif pil == '0':
            clear()
            banner()
#            saldo_idr = atm.checkIDR()
#            rec = randint(100000,1000000)
#            date = str(datetime.datetime.now())
#            print("Record : " + str(rec))
#            print("Waktu : " + date)
#            print("Saldo IDR : Rp.", '{0:n}'.format(saldo_idr))
#            
#            if(path.exists("nasabah/" + str(atm.checkCard()) + ".txt")):
#                file = open("nasabah/" + str(atm.checkCard()) + ".txt", "a")
#                file.write("\n")
#                file.write("Record    : " + str(rec) + "\n")
#                file.write("Waktu     : " + date + "\n")
#                file.write("Rekening  : " + str(atm.checkCard()) + "\n")
#                file.write("Saldo IDR : Rp." + '{0:n}'.format(saldo_idr) + "\n")
#                file.close()
#            else:
#                file = open("nasabah/" + str(atm.checkCard()) + ".txt", "w+")
#                file.write("===================================================\n")
#                file.write("                  Riwayat Transaksi                \n")
#                file.write("===================================================\n")
#                file.write("No Rek    : " + str(atm.checkCard()) + "\n")
#                file.write("Nama      : " + str(atm.checkName()) + "\n")
#                file.write("Status   : " + str(atm.checkStatus()) + "\n")
#                file.write("Sekolah   : " + str(atm.checkSchool()) + "\n")
#                file.write("Alamat   : " + str(atm.checkAlamat()) + "\n")
#                file.write("\n")
#                file.write("\n")
#                file.write("Record    : " + str(rec) + "\n")
#                file.write("Waktu     : " + date + "\n")
#                file.write("Rekening  : " + str(atm.checkCard()) + "\n")
#                file.write("Saldo IDR : Rp." + '{0:n}'.format(saldo_idr) + "\n")
#                file.close()

            status = False
        else:
            clear()
            banner()
            print("Maaf input yang anda masukan tidak ada dalam daftar menu")
            print("Silahkan coba lagi")
            sleep(1)
