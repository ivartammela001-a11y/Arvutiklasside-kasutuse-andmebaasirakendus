-- MySQL dump 10.13  Distrib 9.5.0, for macos26.1 (arm64)
--
-- Host: localhost    Database: klassiruumid
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'c1c27152-d518-11f0-8d50-c05e97dc860d:1-3077';

--
-- Current Database: `klassiruumid`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `klassiruumid` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `klassiruumid`;

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `classroom_id` int NOT NULL,
  `user_id` int NOT NULL,
  `lesson_type_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `participants_count` int NOT NULL DEFAULT '0',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lesson_type_id` (`lesson_type_id`),
  KEY `idx_booking_classroom_date` (`classroom_id`,`date`),
  KEY `idx_booking_user` (`user_id`),
  KEY `idx_booking_date` (`date`),
  CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`classroom_id`) REFERENCES `classroom` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_or_group` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_ibfk_3` FOREIGN KEY (`lesson_type_id`) REFERENCES `lesson_type` (`id`) ON DELETE SET NULL,
  CONSTRAINT `booking_chk_1` CHECK ((`participants_count` >= 0)),
  CONSTRAINT `booking_chk_2` CHECK ((`end_time` > `start_time`))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking`
--

LOCK TABLES `booking` WRITE;
/*!40000 ALTER TABLE `booking` DISABLE KEYS */;
INSERT INTO `booking` VALUES (1,1,1,1,'2026-02-12','08:00:00','09:30:00',28,'Programmeerimise loeng','2026-02-11 14:02:04'),(2,1,2,2,'2026-02-12','10:00:00','11:30:00',25,'Andmebaaside praktikum','2026-02-11 14:02:04'),(3,2,1,2,'2026-02-12','08:00:00','09:30:00',20,'Võrkude praktikum','2026-02-11 14:02:04'),(4,3,3,3,'2026-02-13','13:00:00','14:30:00',18,'IT seminar','2026-02-11 14:02:04'),(5,4,2,1,'2026-02-14','09:00:00','10:30:00',30,'Multimeedia loeng','2026-02-11 14:02:04'),(6,6,5,2,'2026-02-16','10:00:00','11:30:00',20,'Veebiarenduse praktikum','2026-02-11 14:02:22'),(7,7,6,1,'2026-02-16','08:00:00','09:30:00',28,'Programmeerimise loeng','2026-02-11 14:02:22'),(8,8,7,3,'2026-02-17','13:00:00','14:30:00',16,'IT-turvalisuse seminar','2026-02-11 14:02:22'),(9,6,5,4,'2026-02-18','09:00:00','11:00:00',22,'Programmeerimise eksam','2026-02-11 14:02:22');
/*!40000 ALTER TABLE `booking` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_no_overlap_insert` BEFORE INSERT ON `booking` FOR EACH ROW BEGIN
    IF EXISTS (
        SELECT 1 FROM booking
        WHERE classroom_id = NEW.classroom_id
          AND date = NEW.date
          AND NEW.start_time < end_time
          AND NEW.end_time > start_time
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_no_overlap_update` BEFORE UPDATE ON `booking` FOR EACH ROW BEGIN
    IF EXISTS (
        SELECT 1 FROM booking
        WHERE classroom_id = NEW.classroom_id
          AND date = NEW.date
          AND id != NEW.id
          AND NEW.start_time < end_time
          AND NEW.end_time > start_time
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `classroom`
--

DROP TABLE IF EXISTS `classroom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor` int NOT NULL DEFAULT '1',
  `capacity` int NOT NULL,
  `has_projector` tinyint(1) NOT NULL DEFAULT '0',
  `has_webcam` tinyint(1) NOT NULL DEFAULT '0',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  CONSTRAINT `classroom_chk_1` CHECK ((`capacity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classroom`
--

LOCK TABLES `classroom` WRITE;
/*!40000 ALTER TABLE `classroom` DISABLE KEYS */;
INSERT INTO `classroom` VALUES (1,'A-201','A-hoone',2,30,1,1,'Programmeerimise labor','2026-02-11 14:02:04'),(2,'A-202','A-hoone',2,25,1,0,'Võrgutehnoloogia klass','2026-02-11 14:02:04'),(3,'B-101','B-hoone',1,20,0,0,'Arvutiõppe klass','2026-02-11 14:02:04'),(4,'B-305','B-hoone',3,35,1,1,'Multimeedia labor','2026-02-11 14:02:04'),(5,'C-110','C-hoone',1,15,1,0,'Väike seminariruum','2026-02-11 14:02:04'),(6,'D-101','D-hoone',1,22,1,0,'Programmeerimise labor','2026-02-11 14:02:22'),(7,'D-205','D-hoone',2,30,1,1,'Multimeedia klass','2026-02-11 14:02:22'),(8,'E-301','E-hoone',3,18,0,0,'Vorgutehnika labor','2026-02-11 14:02:22'),(9,'E-102','E-hoone',1,24,1,0,'Tarkvara testimise klass','2026-02-11 14:02:22');
/*!40000 ALTER TABLE `classroom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lesson_type`
--

DROP TABLE IF EXISTS `lesson_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lesson_type`
--

LOCK TABLES `lesson_type` WRITE;
/*!40000 ALTER TABLE `lesson_type` DISABLE KEYS */;
INSERT INTO `lesson_type` VALUES (1,'Loeng','Teoreetiline loeng'),(2,'Praktikum','Praktiline töö arvutiklassis'),(3,'Seminar','Arutelu ja rühmatöö'),(4,'Eksam','Eksamite läbiviimine'),(5,'Muu','Muu tegevus');
/*!40000 ALTER TABLE `lesson_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_or_group`
--

DROP TABLE IF EXISTS `user_or_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_or_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('opetaja','grupp','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_or_group`
--

LOCK TABLES `user_or_group` WRITE;
/*!40000 ALTER TABLE `user_or_group` DISABLE KEYS */;
INSERT INTO `user_or_group` VALUES (1,'Mart Tamm','mart.tamm@kool.ee','opetaja','2026-02-11 14:02:04'),(2,'Kati Kask','kati.kask@kool.ee','opetaja','2026-02-11 14:02:04'),(3,'TAK-21','tak21@kool.ee','grupp','2026-02-11 14:02:04'),(4,'Admin Kasutaja','admin@kool.ee','admin','2026-02-11 14:02:04'),(5,'Piret Puu','piret.puu@kool.ee','opetaja','2026-02-11 14:02:22'),(6,'Jaan Jaanson','jaan.jaanson@kool.ee','opetaja','2026-02-11 14:02:22'),(7,'Liina Lepik','liina.lepik@kool.ee','opetaja','2026-02-11 14:02:22'),(8,'RIF-22','rif22@kool.ee','grupp','2026-02-11 14:02:22'),(9,'TAK-23','tak23@kool.ee','grupp','2026-02-11 14:02:22');
/*!40000 ALTER TABLE `user_or_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'klassiruumid'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-11 14:02:27
