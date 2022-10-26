SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --- Tables ---

CREATE TABLE `entries` (
    `id` varchar(128) NOT NULL,
    `created` int(64) NOT NULL,
    `latitude` int(64) DEFAULT NULL,
    `longitude` int(64) DEFAULT NULL,
    `title` text NOT NULL,
    `entry` text NOT NULL,
    `deleted` int(1) DEFAULT 0,
    `label` varchar(128) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

CREATE TABLE `events` (
    `id` varchar(128) NOT NULL,
    `name` varchar(256) NOT NULL,
    `start` int(64) NOT NULL,
    `end` int(64) NOT NULL,
    `label` varchar(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

CREATE TABLE `labels` (
    `id` varchar(128) NOT NULL,
    `name` varchar(256) NOT NULL,
    `colour` varchar(64) NOT NULL,
    `created` int(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

-- --- Indexes ---
ALTER TABLE `entries`ADD PRIMARY KEY (`id`);
ALTER TABLE `events`ADD PRIMARY KEY (`id`);

ALTER TABLE `labels`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `name` (`name`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;