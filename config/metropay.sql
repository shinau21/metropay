-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 04, 2021 at 06:53 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 7.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `metropay`
--

-- --------------------------------------------------------

--
-- Table structure for table `nasabah`
--

CREATE TABLE `nasabah` (
  `rekening` varchar(12) NOT NULL,
  `pin` varchar(8) NOT NULL,
  `nama` varchar(30) NOT NULL,
  `jk` char(1) NOT NULL,
  `alamat` varchar(100) NOT NULL,
  `kec` varchar(100) NOT NULL,
  `kab` varchar(100) NOT NULL,
  `tempat_lahir` varchar(100) NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `nama_ibu` varchar(50) NOT NULL,
  `sekolah` varchar(100) NOT NULL,
  `status` varchar(50) NOT NULL,
  `saldo_idr` varchar(101) NOT NULL,
  `terakhir_akses` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `nasabah`
--

INSERT INTO `nasabah` (`rekening`, `pin`, `nama`, `jk`, `alamat`, `kec`, `kab`, `tempat_lahir`, `tanggal_lahir`, `nama_ibu`, `sekolah`, `status`, `saldo_idr`, `terakhir_akses`) VALUES
('247803852913', '12121212', 'RAFLI SETIAWAN', 'L', 'RAKIT RT 02 / RW 03', 'RAKIT', 'BANJARNEGARA', 'BANJARNEGARA', '2000-04-18', 'SITI MARKHATUN', 'SMK NEGERI 1 KEJOBONG', 'Teknisi', '9090000', '2021-12-04 04:52:54'),
('864026469053', '12121212', 'ARIF FEBRIADI, S.Kom', 'L', 'RAKIT RT 02 / RW 03', 'RAKIT', 'PURBALINGGA', 'PURBALINGGA', '1981-02-04', 'SITI MARKHATUN', 'SMK NEGERI 1 KEJOBONG', 'Siswa', '10000000', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `nasabah`
--
ALTER TABLE `nasabah`
  ADD PRIMARY KEY (`rekening`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
